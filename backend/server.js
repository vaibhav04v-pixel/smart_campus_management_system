
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connectDB = require("./config/db");
const {
  errorHandler,
  notFound,
} = require("./middleware/errorMiddleware");

const app = express();

// ── Configuration ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

// ── Middleware ─────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development origins and non-browser clients.
      // Reject unknown browser origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Health Check ───────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    message: databaseConnected
      ? "Smart Campus API is running"
      : "Smart Campus API is running, but MongoDB is unavailable",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Authentication ─────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));

// ── Campus Management Routes ───────────────────────────────────
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// ── Error Handling (must remain after all routes) ───────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
async function startServer() {
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const instance = app.listen(PORT, () => resolve(instance));
      instance.once("error", reject);
    });
    console.log("======================================");
    console.log("Smart Campus Management System");
    console.log(`Backend: http://localhost:${PORT}`);
    console.log(`Health:  http://localhost:${PORT}/api/health`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || "not configured"}`);
    console.log("======================================");

    try {
      await connectDB();
    } catch (error) {
      console.error(error.message);
      console.error(
        "The API is available in degraded mode. Fix the MongoDB configuration or Atlas access, then restart the backend."
      );
    }
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    if (server) {
      server.close();
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
