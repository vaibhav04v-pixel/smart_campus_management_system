// routes/attendanceRoutes.js
// Routes for Attendance marking and reports.

const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAttendanceByCourse,
  getAttendanceReports,
} = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Mark Attendance (Admin only)
router.post("/mark", protect, adminOnly, markAttendance);

// Reports (Protected — Students see their own; Admin sees all)
router.get("/reports", protect, getAttendanceReports);

// Course-wise date attendance
router.get("/course/:courseId", protect, getAttendanceByCourse);

module.exports = router;
