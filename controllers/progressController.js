const Progress = require("../models/Progress");
const Video = require("../models/video");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Batch = require("../models/Batch");

exports.updateProgress = async (req, res) => {
    try {
        const { courseId, moduleId, videoId } = req.body;
        const userId = req.user.id;

        if (!courseId || !moduleId || !videoId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Validate that video, course, module hierarchy is intact
        const video = await Video.findOne({ _id: videoId, courseId, moduleId });
        if (!video) {
            return res.status(400).json({ success: false, message: "Invalid video or mismatched course/module hierarchy" });
        }

        // Get total videos for the module
        const totalVideos = await Video.countDocuments({ moduleId });
        if (totalVideos === 0) {
            return res.status(400).json({ success: false, message: "Module has no videos" });
        }

        // Find or create progress record
        let progress = await Progress.findOne({ userId, courseId, moduleId });
        if (!progress) {
            progress = new Progress({ userId, courseId, moduleId, completedVideos: [] });
        }

        // Only add if not strictly present
        if (!progress.completedVideos.includes(videoId)) {
            progress.completedVideos.push(videoId);
        }

        // Recalculate percentage
        progress.completionPercentage = (progress.completedVideos.length / totalVideos) * 100;
        
        // Safety cap
        if (progress.completionPercentage > 100) progress.completionPercentage = 100;
        
        progress.lastAccessedVideo = videoId;

        await progress.save();

        res.json({ success: true, message: "Progress updated successfully", data: progress });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const progressRecords = await Progress.find({ courseId, userId }).populate("lastAccessedVideo", "title");

        const overallInfo = progressRecords.map(p => ({
            moduleId: p.moduleId,
            completedCount: p.completedVideos.length,
            percentage: p.completionPercentage,
            lastAccessed: p.lastAccessedVideo
        }));

        res.json({ success: true, message: "Course progress retrieved successfully", data: overallInfo });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserProgress = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const requestor = req.user;

        // Ensure user is checking themselves, or is admin/teacher
        if (requestor.role === "student" && targetUserId !== requestor.id) {
            return res.status(403).json({ success: false, message: "Access denied. You can only view your own progress." });
        }

        // If teacher, verify that target user is in one of the teacher's batches
        if (requestor.role === "teacher") {
            const assignedBatches = await Batch.find({ teacherId: requestor.id });
            let studentInTeacherBatch = false;
            
            for (let b of assignedBatches) {
                if (b.students.includes(targetUserId)) {
                    studentInTeacherBatch = true;
                    break;
                }
            }

            if (!studentInTeacherBatch) {
                return res.status(403).json({ success: false, message: "Access denied. Student is not in any of your assigned batches." });
            }
        }

        const progress = await Progress.find({ userId: targetUserId })
            .populate("courseId", "title")
            .populate("moduleId", "title")
            .populate("lastAccessedVideo", "title");

        res.json({ success: true, message: "User progress retrieved successfully", data: progress });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
