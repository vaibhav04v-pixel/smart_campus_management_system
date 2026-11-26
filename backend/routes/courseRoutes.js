// routes/courseRoutes.js
// Routes for Course Management and Student Assignments.

const express = require("express");
const router = express.Router();

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  assignStudentsToCourse,
  removeStudentFromCourse,
} = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getCourses)
  .post(protect, adminOnly, createCourse);

router.route("/:id")
  .get(protect, getCourseById)
  .put(protect, adminOnly, updateCourse)
  .delete(protect, adminOnly, deleteCourse);

router.route("/:id/enroll")
  .post(protect, adminOnly, assignStudentsToCourse);

router.route("/:id/enroll/:studentId")
  .delete(protect, adminOnly, removeStudentFromCourse);

module.exports = router;
