// routes/studentRoutes.js
// Routes for Student management operations.

const express = require("express");
const router = express.Router();

const {
  getStudents,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Stats endpoint — must be declared BEFORE /:id
router.get("/stats", protect, getStudentStats);

// List & Create
router
  .route("/")
  .get(protect, getStudents)
  .post(protect, adminOnly, createStudent);

// Get, Update, Delete by ID
router
  .route("/:id")
  .get(protect, getStudentById)
  .put(protect, adminOnly, updateStudent)
  .delete(protect, adminOnly, deleteStudent);

module.exports = router;
