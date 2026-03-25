const Module = require("../models/Module");

exports.createModule = async (req, res) => {
    try {
        const { courseId, title, order } = req.body;
        
        if (!courseId || !title || order === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newModule = await Module.create({ courseId, title, order });

        res.status(201).json({ success: true, message: "Module created successfully", data: newModule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const modules = await Module.find({ courseId }).sort({ order: 1 });
        
        res.json({ success: true, message: "Modules retrieved successfully", data: modules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
