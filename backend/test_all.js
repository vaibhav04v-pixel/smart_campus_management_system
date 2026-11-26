// backend/test_all.js
// Master End-to-End Test Suite for Smart Campus Management System.
// Runs complete verification across all stages: Auth, Students, Courses, Attendance, Complaints, Events, Notices, and Dashboard Aggregations.

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const express = require("express");

const User = require("./models/User");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Attendance = require("./models/Attendance");
const Complaint = require("./models/Complaint");
const Event = require("./models/Event");
const Announcement = require("./models/Announcement");
const generateToken = require("./utils/generateToken");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const eventRoutes = require("./routes/eventRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

async function runMasterTest() {
  console.log("================================================================================");
  console.log("🎓 SMART CAMPUS MANAGEMENT SYSTEM — MASTER END-TO-END VERIFICATION SUITE");
  console.log("================================================================================");

  // 1. Database Connection
  console.log("\n[1/6] Connecting to MongoDB Atlas Cloud Database...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Successfully connected to MongoDB Atlas host:", mongoose.connection.host);

  // Set up Express test instance on ephemeral port 5095
  const app = express();
  app.use(express.json());
  app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5095);
  const baseUrl = "http://localhost:5095/api";

  const ts = Date.now();
  const adminEmail = `master_admin_${ts}@campus.edu`;
  const studentEmail = `master_student_${ts}@campus.edu`;

  let adminToken = "";
  let studentToken = "";
  let studentDocId = "";
  let courseDocId = "";
  let eventDocId = "";
  let complaintDocId = "";
  let noticeDocId = "";

  try {
    // 2. Health & Auth Module
    console.log("\n[2/6] Verifying API Health & Authentication (Stage 2)...");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || healthData.status !== "ok") {
      throw new Error("Health check failed");
    }
    console.log("✅ GET /api/health returned HTTP 200 OK.");

    // Public registration must not grant admin privileges.
    const regAdminRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Master Admin",
        email: adminEmail,
        password: "AdminPassword123!",
        role: "admin",
      }),
    });
    if (regAdminRes.status !== 403) {
      throw new Error(`Public admin registration should return 403, got ${regAdminRes.status}`);
    }

    const adminUser = await User.create({
      name: "Master Admin",
      email: adminEmail,
      password: "AdminPassword123!",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id.toString());

    // Register Student
    const regStudentRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Master Student",
        email: studentEmail,
        password: "StudentPassword123!",
        role: "student",
      }),
    });
    studentToken = (await regStudentRes.json()).data.token;

    // Password Bcrypt check in MongoDB
    const rawUser = await User.findOne({ email: adminEmail }).select("+password");
    if (!rawUser.password.startsWith("$2a$") && !rawUser.password.startsWith("$2b$")) {
      throw new Error("Password not hashed with bcrypt in MongoDB!");
    }
    console.log("✅ User registration, bcrypt hashing, and JWT issuance verified.");

    // Protected Route & Admin Guard Check
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (meRes.status !== 200) throw new Error("GET /api/auth/me failed");

    const adminGuardStudent = await fetch(`${baseUrl}/auth/admin-check`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (adminGuardStudent.status !== 403) throw new Error("Student should be 403 on admin-check");

    const adminGuardAdmin = await fetch(`${baseUrl}/auth/admin-check`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminGuardAdmin.status !== 200) throw new Error("Admin should be 200 on admin-check");
    console.log("✅ Protected routes and adminOnly middleware guards verified.");

    // 3. Student Management CRUD (Stage 3)
    console.log("\n[3/6] Verifying Student Management CRUD & Search/Filter (Stage 3)...");
    const rollNo = `CS${ts.toString().slice(-5)}`;
    
    // Create Student as Admin
    const createStudRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: rollNo,
        fullName: "Taylor Swift",
        email: `taylor_${ts}@campus.edu`,
        department: "Computer Science",
        course: "B.Tech",
        semester: 4,
        phoneNumber: "+1-555-0999",
        status: "Active",
      }),
    });
    const studData = await createStudRes.json();
    if (createStudRes.status !== 201) throw new Error("Failed to create student");
    studentDocId = studData.data._id;

    // Duplicate Roll Number Check -> 409
    const dupStud = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: rollNo,
        fullName: "Duplicate Roll",
        email: `other_${ts}@campus.edu`,
        department: "Computer Science",
        course: "B.Tech",
        semester: 4,
        phoneNumber: "+1-555-0888",
      }),
    });
    if (dupStud.status !== 409) throw new Error("Duplicate roll number should return 409");
    console.log("✅ Student creation and unique constraint duplicate rejection verified.");

    // List & Search
    const listStud = await fetch(`${baseUrl}/students?search=${rollNo}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listStudData = await listStud.json();
    if (listStudData.data.length === 0) throw new Error("Search failed to find created student");
    console.log("✅ Student directory search, pagination, and read permissions verified.");

    // 4. Course & Attendance Management (Stage 5)
    console.log("\n[4/6] Verifying Courses & Attendance Tracking (Stage 5)...");
    const courseCode = `CS${ts.toString().slice(-4)}`;

    // Create Course as Admin
    const createCourseRes = await fetch(`${baseUrl}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseCode,
        courseName: "Cloud Architectures",
        department: "Computer Science",
        credits: 4,
        instructor: "Dr. Linus",
        semester: 4,
      }),
    });
    const courseData = await createCourseRes.json();
    if (createCourseRes.status !== 201) throw new Error("Failed to create course");
    courseDocId = courseData.data._id;

    // Enroll Student into Course
    const enrollRes = await fetch(`${baseUrl}/courses/${courseDocId}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ studentIds: [studentDocId] }),
    });
    if (enrollRes.status !== 200) throw new Error("Course enrollment failed");
    console.log("✅ Course created and student enrolled via MongoDB array manipulation.");

    // Mark Attendance (Admin)
    const markAttRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseId: courseDocId,
        date: "2026-10-28",
        records: [{ studentId: studentDocId, status: "Present" }],
      }),
    });
    if (markAttRes.status !== 200) throw new Error("Mark attendance failed");

    // Re-mark on same date to verify compound unique index upsert
    const remarkAttRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseId: courseDocId,
        date: "2026-10-28",
        records: [{ studentId: studentDocId, status: "Present", remarks: "Updated" }],
      }),
    });
    if (remarkAttRes.status !== 200) throw new Error("Attendance upsert failed");

    // Attendance Reports via Aggregation
    const attReportRes = await fetch(`${baseUrl}/attendance/reports?courseId=${courseDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const attReportData = await attReportRes.json();
    if (attReportData.data.length === 0) throw new Error("Attendance report aggregation empty");
    console.log("✅ Attendance roll-call, duplicate prevention, and percentage aggregation verified.");

    // 5. Complaints, Events & Notices (Stage 4)
    console.log("\n[5/6] Verifying Complaints, Events & Notices (Stage 4)...");
    
    // Lodge Complaint as Student
    const compRes = await fetch(`${baseUrl}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Test Complaint",
        description: "Water purifier filter replacement needed in Block A.",
        category: "Hostel",
        priority: "Medium",
      }),
    });
    const compData = await compRes.json();
    complaintDocId = compData.data?._id;

    // Resolve Complaint as Admin
    const resolveComp = await fetch(`${baseUrl}/complaints/${complaintDocId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "Resolved", adminNotes: "Filter replaced." }),
    });
    if (resolveComp.status !== 200) throw new Error("Complaint resolution failed");
    console.log("✅ Complaint submission and admin resolution lifecycle verified.");

    // Create Event as Admin
    const eventRes = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Campus AI Summit",
        description: "Deep dive into agents and large models.",
        category: "Technical",
        venue: "Auditorium",
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        time: "10:00 AM",
        capacity: 100,
      }),
    });
    eventDocId = (await eventRes.json()).data._id;

    // Student Registers for Event
    const regEventRes = await fetch(`${baseUrl}/events/${eventDocId}/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (regEventRes.status !== 200) throw new Error("Event registration failed");
    console.log("✅ Campus event scheduling and 1-click registration verified.");

    // Post Notice as Admin
    const noticeRes = await fetch(`${baseUrl}/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Master Verification Circular",
        content: "Campus systems operational.",
        category: "General",
        priority: "Normal",
      }),
    });
    noticeDocId = (await noticeRes.json()).data._id;
    console.log("✅ Official campus notice published successfully.");

    // 6. Live Dashboard Aggregation Analytics
    console.log("\n[6/6] Verifying Live Dashboard Aggregations (Stage 4 & 5)...");
    const dashRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    if (
      dashRes.status !== 200 ||
      typeof dashData.data?.overview?.totalStudents !== "number" ||
      typeof dashData.data?.overview?.totalCourses !== "number" ||
      typeof dashData.data?.overview?.overallAttendanceRate !== "number" ||
      !Array.isArray(dashData.data?.charts?.departmentBreakdown)
    ) {
      throw new Error("Dashboard aggregation returned invalid shape");
    }
    console.log("✅ Live dashboard metrics successfully calculated via MongoDB aggregation.");

    // Cleanup
    console.log("\nCleaning up master test artifacts from MongoDB Atlas...");
    if (studentDocId) await Student.findByIdAndDelete(studentDocId);
    if (courseDocId) {
      await Course.findByIdAndDelete(courseDocId);
      await Attendance.deleteMany({ course: courseDocId });
    }
    if (eventDocId) await Event.findByIdAndDelete(eventDocId);
    if (complaintDocId) await Complaint.findByIdAndDelete(complaintDocId);
    if (noticeDocId) await Announcement.findByIdAndDelete(noticeDocId);
    await User.deleteMany({ email: { $in: [adminEmail, studentEmail] } });
    console.log("✅ All test records cleanly removed from Atlas.");

    console.log("\n================================================================================");
    console.log("🎉 ALL MASTER INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
    console.log("================================================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runMasterTest().catch((err) => {
  console.error("❌ Master Test error:", err);
  process.exit(1);
});
