require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// INIT APP FIRST
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate Limiting (Prevent brute-force)
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again later",
  standardHeaders: "draft-7", 
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Routes
const testRoutes = require("./routes/testRoutes");
app.use("/api/test", testRoutes);
const videoRoutes = require("./routes/videoRoutes");
app.use("/api/videos", videoRoutes);
// Test route
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running...",
    data: {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});