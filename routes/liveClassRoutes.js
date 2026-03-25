const express = require("express");
const router = express.Router();

const { scheduleClass, getTeacherClasses, getBatchClasses } = require("../controllers/liveClassController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin schedule
router.post("/", authMiddleware, roleMiddleware("admin"), scheduleClass);

// Teacher view classes
router.get("/teacher", authMiddleware, roleMiddleware("teacher"), getTeacherClasses);

// Auth view classes (authorization in controller)
router.get("/batch/:batchId", authMiddleware, getBatchClasses);

module.exports = router;
