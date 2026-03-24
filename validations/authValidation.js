const { body, validationResult } = require("express-validator");

// Reusable middleware to intercept and return validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    next();
};

const validateRegister = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email format is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "student"]).withMessage("Invalid role"),
    handleValidationErrors
];

const validateLogin = [
    body("email").trim().isEmail().withMessage("Valid email format is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    body("deviceId").notEmpty().withMessage("Device ID is required for Single-Device validation"),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin
};
