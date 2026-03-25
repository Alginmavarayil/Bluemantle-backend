const express = require("express");
const router = express.Router();

const { createModule, getCourseModules } = require("../controllers/moduleController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin create module
router.post("/", authMiddleware, roleMiddleware("admin"), createModule);

// Get modules for a specific course
router.get("/:courseId", authMiddleware, getCourseModules);

module.exports = router;
