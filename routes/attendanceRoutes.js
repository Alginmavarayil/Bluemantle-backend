const express = require("express");
const router = express.Router();

const { markAttendance, getStudentAttendance, getClassAttendance } = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Teacher marking (admin implicitly allowed in controller if needed, but strict to teacher here)
router.post("/mark", authMiddleware, roleMiddleware("teacher"), markAttendance);

// Auth views
router.get("/student/:id", authMiddleware, getStudentAttendance);
router.get("/class/:id", authMiddleware, getClassAttendance);

module.exports = router;
