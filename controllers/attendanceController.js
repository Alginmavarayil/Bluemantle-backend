const Attendance = require("../models/Attendance");
const LiveClass = require("../models/LiveClass");

exports.markAttendance = async (req, res) => {
    try {
        const { classId, records } = req.body; 
        // Array of { studentId, status }
        
        if (!classId || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: "Missing classId or records array" });
        }

        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Live Class not found" });

        // Teacher check: Only the assigned teacher of the class can mark attendance
        if (liveClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied. You are not the teacher for this class." });
        }

        const ops = records.map(record => ({
            updateOne: {
                filter: { classId, studentId: record.studentId },
                update: { $set: { status: record.status } },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(ops);

        res.json({ success: true, message: "Attendance marked successfully", data: {} });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate attendance records prevented." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.params.id || req.user.id;
        
        // Ensure students only view their own
        if (req.user.role === "student" && studentId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const attendance = await Attendance.find({ studentId }).populate("classId", "topic date zoomLink");
        res.json({ success: true, message: "Attendance retrieved successfully", data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getClassAttendance = async (req, res) => {
    try {
        const { id: classId } = req.params;
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return res.status(404).json({ success: false, message: "Live Class not found" });

        // Access checks
        if (req.user.role === "teacher" && liveClass.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        const attendance = await Attendance.find({ classId }).populate("studentId", "name email");
        res.json({ success: true, message: "Class attendance retrieved successfully", data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
