// routes/dashboardRoutes.js
// Aggregated statistics and dashboard analytics route.

const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getStudentDashboard,
} = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/student", protect, getStudentDashboard);

module.exports = router;
