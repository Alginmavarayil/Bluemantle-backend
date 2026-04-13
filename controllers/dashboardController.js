const mongoose = require("mongoose");
const User = require("../models/user");
const Progress = require("../models/Progress");
const Batch = require("../models/Batch");
const LiveClass = require("../models/LiveClass");
const Notification = require("../models/Notification");
const Attendance = require("../models/Attendance");

exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Execute parallel queries
    const [user, progressRecords, batch, notifications, attendanceStats] = await Promise.all([
      User.findById(userId)
        .select("enrolledCourses")
        .populate({
          path: "enrolledCourses",
          select: "title description price isPaid",
          match: { isActive: true }
        })
        .lean(),

      Progress.find({ userId })
        .select("courseId completionPercentage")
        .lean(),

      Batch.findOne({ students: userId })
        .select("_id name")
        .lean(),

      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("message type isRead createdAt")
        .lean(),

      Attendance.aggregate([
        { $match: { studentId: new mongoose.Types.ObjectId(userId) } },
        { 
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // 2. Fetch Upcoming Classes sequentially (since it needs batch._id)
    let upcomingClasses = [];
    if (batch) {
      upcomingClasses = await LiveClass.find({
        batchId: batch._id,
        date: { $gte: new Date() }
      })
      .sort({ date: 1 })
      .limit(5)
      .select("topic date duration zoomLink")
      .lean();
    }

    // 3. Transform Progress Data (Course-wise average completion percentage)
    const progressMap = {};
    if (progressRecords && progressRecords.length > 0) {
      const courseProgressTracker = {};

      progressRecords.forEach((p) => {
        const cid = p.courseId.toString();
        if (!courseProgressTracker[cid]) {
          courseProgressTracker[cid] = { totalPercentage: 0, count: 0 };
        }
        courseProgressTracker[cid].totalPercentage += parseFloat(p.completionPercentage) || 0;
        courseProgressTracker[cid].count += 1;
      });

      for (const cid in courseProgressTracker) {
        progressMap[cid] = (courseProgressTracker[cid].totalPercentage / courseProgressTracker[cid].count).toFixed(2);
      }
    }

    // 4. Format Attendance Summary
    let attendanceSummary = { totalClasses: 0, present: 0, percentage: 0 };
    if (attendanceStats && attendanceStats.length > 0) {
      const stats = attendanceStats[0];
      const percentage = stats.totalClasses > 0 ? (stats.present / stats.totalClasses) * 100 : 0;
      attendanceSummary = {
        totalClasses: stats.totalClasses || 0,
        present: stats.present || 0,
        percentage: Number(percentage.toFixed(2))
      };
    }

    // 5. Build Final Aggregated Response safely avoiding nulls
    return res.json({
      success: true,
      data: {
        enrolledCourses: user?.enrolledCourses || [],
        progress: progressMap,
        upcomingClasses: upcomingClasses || [],
        notifications: notifications || [],
        attendanceSummary
      }
    });

  } catch (error) {
    console.error("Error in getStudentDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();

    // Execute parallel queries for performance
    const [batches, todayClasses, upcomingClasses, teacherClasses] = await Promise.all([
      Batch.find({ teacherId })
        .select("name courseId students maxStudents")
        .populate("courseId", "title")
        .lean(),
        
      LiveClass.find({
        teacherId,
        date: { $gte: todayStart, $lte: todayEnd }
      })
        .sort({ date: 1 })
        .select("topic date duration zoomLink batchId reminderSent")
        .populate("batchId", "name")
        .lean(),
        
      LiveClass.find({
        teacherId,
        date: { $gte: now }
      })
        .sort({ date: 1 })
        .limit(5)
        .select("topic date duration zoomLink batchId reminderSent")
        .populate("batchId", "name")
        .lean(),
        
      LiveClass.find({ teacherId })
        .select("_id")
        .lean()
    ]);

    // Calculate total student count
    const studentCount = batches.reduce((sum, b) => sum + (b.students ? b.students.length : 0), 0);

    // Calculate attendance summary
    const classIds = teacherClasses.map(c => c._id);
    let attendanceSummary = { 
      totalClassesHandled: teacherClasses.length, 
      totalAttendanceMarked: 0, 
      averageAttendancePercentage: 0 
    };

    if (classIds.length > 0) {
      const attendanceStats = await Attendance.aggregate([
        { $match: { classId: { $in: classIds } } },
        {
          $group: {
            _id: null,
            totalMarked: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
            }
          }
        }
      ]);

      if (attendanceStats && attendanceStats.length > 0) {
        const stats = attendanceStats[0];
        attendanceSummary.totalAttendanceMarked = stats.totalMarked;
        const percentage = stats.totalMarked > 0 ? (stats.present / stats.totalMarked) * 100 : 0;
        attendanceSummary.averageAttendancePercentage = Number(percentage.toFixed(2));
      }
    }

    // Return structured response
    return res.json({
      success: true,
      data: {
        assignedBatches: batches || [],
        studentCount: studentCount || 0,
        todayClasses: todayClasses || [],
        upcomingClasses: upcomingClasses || [],
        attendanceSummary
      }
    });

  } catch (error) {
    console.error("Error in getTeacherDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
