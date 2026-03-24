const User = require("../models/user");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists with this email" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create the user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "student"
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {}
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Login a user
exports.login = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;

        // Basic validation
        if (!email || !password || !deviceId) {
            return res.status(400).json({ success: false, message: "Please provide email, password, and deviceId" });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Device-Based Access Control logic
        if (!user.deviceId) {
            // First time login, bind device
            user.deviceId = deviceId;
            user.lastActive = Date.now();
            await user.save();
        } else if (user.deviceId !== deviceId) {
            // New device detected
            return res.status(401).json({ 
                success: false, 
                message: "New device detected. Contact admin." 
            });
        } else {
            // Same device, update activity
            user.lastActive = Date.now();
            await user.save();
        }

        // Generate JWT token (expires in 10 minutes)
        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
