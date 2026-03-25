const Note = require("../models/Note");

exports.createNote = async (req, res) => {
    try {
        const { title, fileUrl, courseId, moduleId } = req.body;
        
        if (!title || !fileUrl || !courseId || !moduleId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const note = await Note.create({ title, fileUrl, courseId, moduleId });

        res.status(201).json({ success: true, message: "Note created successfully", data: note });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
