const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Protected route (any logged-in user)
router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "You are authorized",
        data: {
            user: req.user
        }
    });
});

// Admin-only route
router.get("/admin", authMiddleware, roleMiddleware("admin"), (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin",
        data: {}
    });
});

module.exports = router;