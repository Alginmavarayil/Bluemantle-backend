const express = require("express");
const router = express.Router();

const { addVideo } = require("../controllers/videoController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin adds video
router.post("/", authMiddleware, roleMiddleware("admin"), addVideo);

// Removed generic getVideos route to comply with CMS security

module.exports = router;