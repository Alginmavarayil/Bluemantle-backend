const express = require("express");
const router = express.Router();

const { createNote } = require("../controllers/noteController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin create note
router.post("/", authMiddleware, roleMiddleware("admin"), createNote);

module.exports = router;
