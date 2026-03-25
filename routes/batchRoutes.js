const express = require("express");
const router = express.Router();

const { 
    createBatch, 
    listBatches, 
    getBatchDetails, 
    assignTeacher, 
    addStudents, 
    removeStudent 
} = require("../controllers/batchController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin routes
router.post("/", authMiddleware, roleMiddleware("admin"), createBatch);
router.get("/", authMiddleware, roleMiddleware("admin"), listBatches);

router.post("/:id/assign-teacher", authMiddleware, roleMiddleware("admin"), assignTeacher);
router.post("/:id/add-students", authMiddleware, roleMiddleware("admin"), addStudents);
router.post("/:id/remove-student", authMiddleware, roleMiddleware("admin"), removeStudent);

// Authenticated viewing route (authorization handled intimately in the controller)
router.get("/:id", authMiddleware, getBatchDetails);

module.exports = router;
