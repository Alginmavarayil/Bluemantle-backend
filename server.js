require("dotenv").config();
const validateEnv = require("./config/envValidator");
const connectDB = require("./config/db");

// Validate environment variables before anything else
validateEnv();

// Connect to MongoDB
connectDB();

// Initialize Cron Scheduler
const initScheduler = require("./utils/scheduler");
initScheduler();

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

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const courseRoutes = require("./routes/courseRoutes");
app.use("/api/courses", courseRoutes);

const moduleRoutes = require("./routes/moduleRoutes");
app.use("/api/modules", moduleRoutes);

const videoRoutes = require("./routes/videoRoutes");
app.use("/api/videos", videoRoutes);

const noteRoutes = require("./routes/noteRoutes");
app.use("/api/notes", noteRoutes);

const batchRoutes = require("./routes/batchRoutes");
app.use("/api/batches", batchRoutes);

const liveClassRoutes = require("./routes/liveClassRoutes");
app.use("/api/classes", liveClassRoutes);

const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

const progressRoutes = require("./routes/progressRoutes");
app.use("/api/progress", progressRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const institutionalRoutes = require("./routes/institutionalRoutes");
app.use("/api/institutional", institutionalRoutes);

// Test route
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