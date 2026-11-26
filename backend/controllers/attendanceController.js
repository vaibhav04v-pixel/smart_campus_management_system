// controllers/attendanceController.js
// Handles student attendance marking, duplicate prevention, and aggregation reporting.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Course = require("../models/Course");
const Student = require("../models/Student");

// Helper to normalize a date to midnight UTC (YYYY-MM-DD 00:00:00Z)
const normalizeDate = (d) => {
  const dateObj = new Date(d);
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
};

// ── markAttendance ────────────────────────────────────────────────────────────
// POST /api/attendance/mark
// Access: Protected (Admin only)
// Body: { courseId, date, records: [{ studentId, status, remarks }] }
const markAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;

  if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error("Course ID, date, and attendance records array are required");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400);
    throw new Error("Invalid course ID format");
  }

  const normalized = normalizeDate(date);

  // Bulk operations using upsert to prevent duplicate records and update seamlessly
  const bulkOps = records.map((rec) => ({
    updateOne: {
      filter: {
        course: courseId,
        student: rec.studentId,
        date: normalized,
      },
      update: {
        $set: {
          status: rec.status || "Present",
          remarks: rec.remarks ? rec.remarks.trim() : "",
          markedBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(bulkOps);

  res.status(200).json({
    success: true,
    message: `Attendance marked for ${records.length} student(s) on ${normalized.toISOString().split("T")[0]}`,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    },
  });
});

// ── getAttendanceByCourse ─────────────────────────────────────────────────────
// GET /api/attendance/course/:courseId
// Access: Protected
const getAttendanceByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400);
    throw new Error("Invalid course ID");
  }

  const query = { course: courseId };
  if (req.user.role !== "admin") {
    const student = await Student.findOne({ email: req.user.email }).select("_id");
    if (!student) {
      return res.json({ success: true, count: 0, data: [] });
    }
    query.student = student._id;
  }
  if (date) {
    query.date = normalizeDate(date);
  }

  const records = await Attendance.find(query)
    .populate("student", "rollNumber fullName email department")
    .sort({ date: -1 });

  res.json({
    success: true,
    count: records.length,
    data: records,
  });
});

// ── getAttendanceReports ──────────────────────────────────────────────────────
// GET /api/attendance/reports
// Access: Protected
// Demonstrates MongoDB Aggregation ($match, $group, $project) for attendance %
const getAttendanceReports = asyncHandler(async (req, res) => {
  const matchStage = {};

  if (req.query.courseId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.courseId)) {
      res.status(400);
      throw new Error("Invalid course ID");
    }
    matchStage.course = new mongoose.Types.ObjectId(req.query.courseId);
  }

  if (req.query.studentId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      res.status(400);
      throw new Error("Invalid student ID");
    }
    matchStage.student = new mongoose.Types.ObjectId(req.query.studentId);
  }

  // If a student user is requesting reports, ensure they only access their own
  if (req.user.role !== "admin") {
    const studentDoc = await Student.findOne({ email: req.user.email });
    if (studentDoc) {
      matchStage.student = studentDoc._id;
    } else {
      // User has no student record linked
      return res.json({ success: true, count: 0, data: [] });
    }
  }

  if (req.query.startDate && req.query.endDate) {
    matchStage.date = {
      $gte: normalizeDate(req.query.startDate),
      $lte: normalizeDate(req.query.endDate),
    };
  }

  // MongoDB Aggregation Pipeline to compute attendance percentage
  const report = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { student: "$student", course: "$course" },
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "_id.student",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id.course",
        foreignField: "_id",
        as: "courseInfo",
      },
    },
    { $unwind: "$studentInfo" },
    { $unwind: "$courseInfo" },
    {
      $project: {
        studentId: "$_id.student",
        studentName: "$studentInfo.fullName",
        rollNumber: "$studentInfo.rollNumber",
        courseId: "$_id.course",
        courseCode: "$courseInfo.courseCode",
        courseName: "$courseInfo.courseName",
        totalClasses: 1,
        presentCount: 1,
        lateCount: 1,
        absentCount: 1,
        attendancePercentage: {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $add: [
                        "$presentCount",
                        { $multiply: ["$lateCount", 0.5] }, // Late counts as half present
                      ],
                    },
                    { $cond: [{ $eq: ["$totalClasses", 0] }, 1, "$totalClasses"] },
                  ],
                },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    { $sort: { attendancePercentage: -1 } },
  ]);

  res.json({
    success: true,
    count: report.length,
    data: report,
  });
});

module.exports = {
  markAttendance,
  getAttendanceByCourse,
  getAttendanceReports,
};
