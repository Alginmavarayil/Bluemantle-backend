const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");

exports.scheduleClass = async (req, res) => {
    try {
        const { batchId, teacherId, zoomLink, topic, date, duration } = req.body;
        if (!batchId || !teacherId || !zoomLink || !date) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });
        if (batch.teacherId && batch.teacherId.toString() !== teacherId.toString()) {
            return res.status(400).json({ success: false, message: "Warning: Assigning a class to a non-matching teacher for this batch" });
        }

        const liveClass = await LiveClass.create({ batchId, teacherId, zoomLink, topic, date, duration });
        res.status(201).json({ success: true, message: "Live Class scheduled successfully", data: liveClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTeacherClasses = async (req, res) => {
    try {
        // Teacher is authenticated, find classes matching their ID
        const classes = await LiveClass.find({ teacherId: req.user.id }).populate("batchId", "name courseId");
        res.json({ success: true, message: "Classes retrieved successfully", data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBatchClasses = async (req, res) => {
    try {
        const { batchId } = req.params;
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        // Access Check
        if (req.user.role === "student" && !batch.students.includes(req.user.id)) {
            return res.status(403).json({ success: false, message: "Access denied. Not in batch." });
        }

        const classes = await LiveClass.find({ batchId }).sort({ date: 1 });
        res.json({ success: true, message: "Batch classes retrieved successfully", data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
