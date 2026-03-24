const express = require("express");
const router = express.Router();

const { addVideo, getVideos } = require("../controllers/videoController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin adds video
router.post("/", authMiddleware, roleMiddleware("admin"), addVideo);

// Students view videos
router.get("/", authMiddleware, getVideos);

module.exports = router;