// controllers/courseController.js
// Handles academic courses, catalogs, and student enrollments.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");

// ── getCourses ────────────────────────────────────────────────────────────────
// GET /api/courses
// Access: Protected
const getCourses = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.department) {
    query.department = req.query.department;
  }
  if (req.query.semester) {
    query.semester = Number(req.query.semester);
  }
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    query.$or = [
      { courseCode: searchRegex },
      { courseName: searchRegex },
      { instructor: searchRegex },
    ];
  }

  const courses = await Course.find(query)
    .populate("enrolledStudents", "rollNumber fullName email department")
    .sort({ courseCode: 1 });

  res.json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// ── getCourseById ─────────────────────────────────────────────────────────────
// GET /api/courses/:id
// Access: Protected
const getCourseById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid course ID format");
  }

  const course = await Course.findById(req.params.id).populate(
    "enrolledStudents",
    "rollNumber fullName email department semester phoneNumber status"
  );

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json({
    success: true,
    data: course,
  });
});

// ── createCourse ──────────────────────────────────────────────────────────────
// POST /api/courses
// Access: Protected (Admin only)
const createCourse = asyncHandler(async (req, res) => {
  const {
    courseCode,
    courseName,
    department,
    credits,
    instructor,
    semester,
    description,
  } = req.body;

  if (!courseCode || !courseName || !department || !credits || !instructor || !semester) {
    res.status(400);
    throw new Error("Please provide all required course details");
  }

  const existing = await Course.findOne({
    courseCode: courseCode.trim().toUpperCase(),
  });
  if (existing) {
    res.status(409);
    throw new Error(`Course code '${courseCode.toUpperCase()}' already exists`);
  }

  const course = await Course.create({
    courseCode: courseCode.trim().toUpperCase(),
    courseName: courseName.trim(),
    department,
    credits: Number(credits),
    instructor: instructor.trim(),
    semester: Number(semester),
    description: description ? description.trim() : "",
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

// ── updateCourse ──────────────────────────────────────────────────────────────
// PUT /api/courses/:id
// Access: Protected (Admin only)
const updateCourse = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid course ID format");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const {
    courseCode,
    courseName,
    department,
    credits,
    instructor,
    semester,
    description,
  } = req.body;

  if (courseCode && courseCode.trim().toUpperCase() !== course.courseCode) {
    const duplicate = await Course.findOne({
      courseCode: courseCode.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      res.status(409);
      throw new Error(`Course code '${courseCode.toUpperCase()}' is already in use`);
    }
    course.courseCode = courseCode.trim().toUpperCase();
  }

  if (courseName) course.courseName = courseName.trim();
  if (department) course.department = department;
  if (credits) course.credits = Number(credits);
  if (instructor) course.instructor = instructor.trim();
  if (semester) course.semester = Number(semester);
  if (description !== undefined) course.description = description.trim();

  const updatedCourse = await course.save();

  res.json({
    success: true,
    message: "Course updated successfully",
    data: updatedCourse,
  });
});

// ── deleteCourse ──────────────────────────────────────────────────────────────
// DELETE /api/courses/:id
// Access: Protected (Admin only)
const deleteCourse = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid course ID format");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Delete course and related attendance records
  await Promise.all([
    Course.findByIdAndDelete(req.params.id),
    Attendance.deleteMany({ course: req.params.id }),
  ]);

  res.json({
    success: true,
    message: `Course '${course.courseCode}' and associated attendance records deleted`,
    data: { id: req.params.id },
  });
});

// ── assignStudentsToCourse ────────────────────────────────────────────────────
// POST /api/courses/:id/enroll
// Access: Protected (Admin only)
const assignStudentsToCourse = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid course ID format");
  }

  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400);
    throw new Error("Please provide an array of student IDs to enroll");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Use $addToSet to prevent duplicate student enrollments in MongoDB array
  await Course.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { enrolledStudents: { $each: studentIds } } },
    { returnDocument: "after" }
  );

  const updatedCourse = await Course.findById(req.params.id).populate(
    "enrolledStudents",
    "rollNumber fullName email department"
  );

  res.json({
    success: true,
    message: `Enrolled ${studentIds.length} student(s) into course '${course.courseCode}'`,
    data: updatedCourse,
  });
});

// ── removeStudentFromCourse ───────────────────────────────────────────────────
// DELETE /api/courses/:id/enroll/:studentId
// Access: Protected (Admin only)
const removeStudentFromCourse = asyncHandler(async (req, res) => {
  const { id, studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
    res.status(400);
    throw new Error("Invalid ID format");
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { $pull: { enrolledStudents: studentId } },
    { returnDocument: "after" }
  ).populate("enrolledStudents", "rollNumber fullName email department");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json({
    success: true,
    message: "Student removed from course enrollment",
    data: course,
  });
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  assignStudentsToCourse,
  removeStudentFromCourse,
};
