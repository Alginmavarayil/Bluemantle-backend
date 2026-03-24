const Video = require("../models/Video");

// Add video (ADMIN ONLY)
exports.addVideo = async (req, res) => {
  try {
    const { title, youtubeId } = req.body;

    const video = await Video.create({
      title,
      youtubeId
    });

    res.json({
      success: true,
      message: "Video added",
      data: video
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all videos (STUDENT)
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    res.json({
      success: true,
      message: "Videos retrieved successfully",
      data: videos
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};