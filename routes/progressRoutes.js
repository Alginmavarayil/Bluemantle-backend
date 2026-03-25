const express = require("express");
const router = express.Router();

const { updateProgress, getCourseProgress, getUserProgress } = require("../controllers/progressController");

const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.post("/update", authMiddleware, updateProgress);
router.get("/course/:courseId", authMiddleware, getCourseProgress);
router.get("/user/:userId", authMiddleware, getUserProgress);

module.exports = router;
