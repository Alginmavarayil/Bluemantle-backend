const Video = require("../models/video");

exports.addVideo = async (req, res) => {
    try {
        const { title, youtubeId, courseId, moduleId, order } = req.body;

        if (!title || !youtubeId || !courseId || !moduleId || order === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const video = await Video.create({
            title,
            youtubeId,
            courseId,
            moduleId,
            order
        });

        res.status(201).json({
            success: true,
            message: "Video added successfully",
            data: video
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};