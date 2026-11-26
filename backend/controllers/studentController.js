// controllers/studentController.js
// Handles all CRUD operations, filtering, pagination, and statistics for Students.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Student = require("../models/Student");

// ── getStudents ───────────────────────────────────────────────────────────────
// GET /api/students
// Access: Protected (All authenticated users)
// Supports: search, department filter, course filter, semester filter, status filter, pagination
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build MongoDB query filter
  const query = {};

  // Text search on rollNumber, fullName, or email
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    query.$or = [
      { fullName: searchRegex },
      { rollNumber: searchRegex },
      { email: searchRegex },
    ];
  }

  // Exact match filters
  if (req.query.department) {
    query.department = req.query.department;
  }
  if (req.query.course) {
    query.course = req.query.course;
  }
  if (req.query.semester) {
    query.semester = Number(req.query.semester);
  }
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Sorting
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  // Fetch count and paginated data concurrently
  const [total, students] = await Promise.all([
    Student.countDocuments(query),
    Student.find(query).sort(sortOptions).skip(skip).limit(limit),
  ]);

  res.json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
    data: students,
  });
});

// ── getStudentStats ───────────────────────────────────────────────────────────
// GET /api/students/stats
// Access: Protected (All authenticated users)
// Demonstrates MongoDB aggregation pipeline ($group, $match, $sort)
const getStudentStats = asyncHandler(async (req, res) => {
  const [totalStudents, activeStudents, departmentStats, courseStats] =
    await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: "Active" }),

      // MongoDB Aggregation: Department Breakdown
      Student.aggregate([
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // MongoDB Aggregation: Course Breakdown
      Student.aggregate([
        {
          $group: {
            _id: "$course",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      departmentStats,
      courseStats,
    },
  });
});

// ── getStudentById ────────────────────────────────────────────────────────────
// GET /api/students/:id
// Access: Protected
const getStudentById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid student ID format");
  }

  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  res.json({
    success: true,
    data: student,
  });
});

// ── createStudent ─────────────────────────────────────────────────────────────
// POST /api/students
// Access: Protected (Admin only)
const createStudent = asyncHandler(async (req, res) => {
  const {
    rollNumber,
    fullName,
    email,
    department,
    course,
    semester,
    phoneNumber,
    status,
  } = req.body;

  // Validation
  if (
    !rollNumber ||
    !fullName ||
    !email ||
    !department ||
    !course ||
    !semester ||
    !phoneNumber
  ) {
    res.status(400);
    throw new Error("Please provide all required student fields");
  }

  // Duplicate checks for roll number and email
  const existingRoll = await Student.findOne({
    rollNumber: rollNumber.trim().toUpperCase(),
  });
  if (existingRoll) {
    res.status(409);
    throw new Error(`Roll number '${rollNumber.toUpperCase()}' is already assigned`);
  }

  const existingEmail = await Student.findOne({
    email: email.trim().toLowerCase(),
  });
  if (existingEmail) {
    res.status(409);
    throw new Error(`Student email '${email.toLowerCase()}' already exists`);
  }

  const student = await Student.create({
    rollNumber: rollNumber.trim().toUpperCase(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    department,
    course,
    semester: Number(semester),
    phoneNumber: phoneNumber.trim(),
    status: status || "Active",
  });

  res.status(201).json({
    success: true,
    message: "Student record created successfully",
    data: student,
  });
});

// ── updateStudent ─────────────────────────────────────────────────────────────
// PUT /api/students/:id
// Access: Protected (Admin only)
const updateStudent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid student ID format");
  }

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const {
    rollNumber,
    fullName,
    email,
    department,
    course,
    semester,
    phoneNumber,
    status,
  } = req.body;

  // Check if updating to an already taken rollNumber or email
  if (rollNumber && rollNumber.trim().toUpperCase() !== student.rollNumber) {
    const duplicateRoll = await Student.findOne({
      rollNumber: rollNumber.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });
    if (duplicateRoll) {
      res.status(409);
      throw new Error(`Roll number '${rollNumber.toUpperCase()}' is already in use`);
    }
  }

  if (email && email.trim().toLowerCase() !== student.email) {
    const duplicateEmail = await Student.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: req.params.id },
    });
    if (duplicateEmail) {
      res.status(409);
      throw new Error(`Email '${email.toLowerCase()}' is already in use`);
    }
  }

  // Update fields
  if (rollNumber) student.rollNumber = rollNumber.trim().toUpperCase();
  if (fullName) student.fullName = fullName.trim();
  if (email) student.email = email.trim().toLowerCase();
  if (department) student.department = department;
  if (course) student.course = course;
  if (semester) student.semester = Number(semester);
  if (phoneNumber) student.phoneNumber = phoneNumber.trim();
  if (status) student.status = status;

  const updatedStudent = await student.save();

  res.json({
    success: true,
    message: "Student record updated successfully",
    data: updatedStudent,
  });
});

// ── deleteStudent ─────────────────────────────────────────────────────────────
// DELETE /api/students/:id
// Access: Protected (Admin only)
const deleteStudent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid student ID format");
  }

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  await Student.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: `Student '${student.fullName}' (${student.rollNumber}) deleted successfully`,
    data: { id: req.params.id },
  });
});

module.exports = {
  getStudents,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
