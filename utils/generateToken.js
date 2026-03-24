const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
    // process.env.JWT_SECRET must be defined
    const secret = process.env.JWT_SECRET || "fallback_secret_for_dev";
    return jwt.sign({ id: userId, role }, secret, {
        expiresIn: "10m",
    });
};

module.exports = generateToken;
