// controllers/dashboardController.js
// Provides comprehensive live campus statistics using MongoDB Aggregation Pipelines.

const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Complaint = require("../models/Complaint");
const Event = require("../models/Event");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const STUDENT_PENDING_STATUSES = ["Pending", "In Review", "In Progress"];

// ── getDashboardStats ─────────────────────────────────────────────────────────
// GET /api/dashboard/stats
// Access: Protected
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const [
    totalStudents,
    activeStudents,
    departmentBreakdown,
    totalComplaints,
    complaintStatusBreakdown,
    complaintPriorityBreakdown,
    upcomingEventsCount,
    totalAnnouncements,
    totalCourses,
    attendanceAgg,
    recentAnnouncements,
    recentEvents,
    recentComplaints,
    totalUsers,
  ] = await Promise.all([
    // Student Metrics
    Student.countDocuments(),
    Student.countDocuments({ status: "Active" }),
    Student.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Complaint Metrics
    Complaint.countDocuments(),
    Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),

    // Event & Announcement Metrics
    Event.countDocuments({ status: "Upcoming", date: { $gte: now } }),
    Announcement.countDocuments({ isActive: true }),

    // Course & Attendance Metrics
    Course.countDocuments(),
    Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
        },
      },
    ]),

    // Feeds
    Announcement.find({
      isActive: true,
      targetAudience: { $in: ["All", "Students"] },
    }).sort({ createdAt: -1 }).limit(3),
    Event.find({ status: "Upcoming", date: { $gte: now } }).sort({ date: 1 }).limit(3),
    Complaint.find().sort({ createdAt: -1 }).limit(4),
    User.countDocuments(),
  ]);

  // Format Status map for fast O(1) frontend lookup
  const complaintStatusMap = {
    Pending: 0,
    "In Progress": 0,
    "In Review": 0,
    Resolved: 0,
    Rejected: 0,
  };
  complaintStatusBreakdown.forEach((item) => {
    if (item._id) complaintStatusMap[item._id] = item.count;
  });
  const pendingComplaints = STUDENT_PENDING_STATUSES.reduce(
    (total, status) => total + (complaintStatusMap[status] || 0),
    0
  );

  // Calculate overall attendance rate percentage
  let overallAttendanceRate = null;
  if (attendanceAgg.length > 0 && attendanceAgg[0].total > 0) {
    const { total, present, late } = attendanceAgg[0];
    overallAttendanceRate = Math.round(((present + late * 0.5) / total) * 100);
  }

  res.json({
    success: true,
    data: {
      overview: {
        totalStudents,
        activeStudents,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints: complaintStatusMap.Resolved,
        upcomingEventsCount,
        totalAnnouncements,
        totalCourses,
        overallAttendanceRate,
        totalUsers,
      },
      charts: {
        departmentBreakdown,
        complaintStatusBreakdown: complaintStatusMap,
        complaintPriorityBreakdown,
      },
      feeds: {
        recentAnnouncements,
        recentEvents,
        recentComplaints,
      },
    },
  });
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const student = await Student.findOne({ email: req.user.email }).select(
    "_id fullName rollNumber status"
  );

  const studentId = student?._id;
  const [
    enrolledCourses,
    attendanceTotals,
    totalComplaints,
    pendingComplaints,
    upcomingEventsCount,
    upcomingEvents,
    announcements,
  ] = await Promise.all([
    studentId
      ? Course.find({ enrolledStudents: studentId })
          .select("courseCode courseName instructor credits semester")
          .sort({ courseCode: 1 })
      : [],
    studentId
      ? Attendance.aggregate([
          { $match: { student: studentId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: {
                $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
              },
              late: {
                $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
              },
            },
          },
        ])
      : [],
    Complaint.countDocuments({ submittedBy: req.user._id }),
    Complaint.countDocuments({
      submittedBy: req.user._id,
      status: { $in: STUDENT_PENDING_STATUSES },
    }),
    Event.countDocuments({ status: "Upcoming", date: { $gte: now } }),
    Event.find({ status: "Upcoming", date: { $gte: now } })
      .select("title description category venue date time")
      .sort({ date: 1 })
      .limit(5),
    Announcement.find({
      isActive: true,
      targetAudience: { $in: ["All", "Students"] },
    })
      .select("title content category priority postedBy createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const attendance = attendanceTotals[0] || null;
  const attendancePercentage = attendance
    ? Math.round(
        ((attendance.present + attendance.late * 0.5) / attendance.total) * 100
      )
    : null;

  res.json({
    success: true,
    data: {
      student: student
        ? {
            _id: student._id,
            fullName: student.fullName,
            rollNumber: student.rollNumber,
            status: student.status,
          }
        : null,
      overview: {
        enrolledCourseCount: enrolledCourses.length,
        attendancePercentage,
        attendanceRecords: attendance?.total || 0,
        presentAttendance: attendance?.present || 0,
        lateAttendance: attendance?.late || 0,
        absentAttendance: attendance?.absent || 0,
        totalComplaints,
        pendingComplaints,
        upcomingEventsCount,
        totalAnnouncements: announcements.length,
      },
      enrolledCourses,
      upcomingEvents,
      announcements,
    },
  });
});

module.exports = { getDashboardStats, getStudentDashboard };
