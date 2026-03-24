const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch User and check inactivity timeout
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        const now = new Date();
        const tenMinutesMs = 10 * 60 * 1000;
        const timeSinceLastActive = now.getTime() - new Date(user.lastActive).getTime();

        if (timeSinceLastActive > tenMinutesMs) {
            return res.status(401).json({
                success: false,
                message: "Session expired due to inactivity"
            });
        }

        // Optimize DB calls: update only if at least 1 minute has passed since last update
        // to avoid unnecessary saves on high frequency requests.
        const oneMinuteMs = 1 * 60 * 1000;
        if (timeSinceLastActive > oneMinuteMs) {
            user.lastActive = now;
            await user.save();
        }

        // Attach user to request
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token"
        });
    }
};

module.exports = authMiddleware;