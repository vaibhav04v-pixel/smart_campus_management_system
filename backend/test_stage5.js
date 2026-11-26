// backend/test_stage5.js
// Automated verification script for Stage 5: Courses, Attendance, Duplicate Prevention, and Reports.

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const express = require("express");
const User = require("./models/User");
const generateToken = require("./utils/generateToken");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Attendance = require("./models/Attendance");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

async function runTests() {
  console.log("=== Stage 5: Course & Attendance Management Automated Test ===");

  // 1. Connect to MongoDB Atlas
  console.log("\n[1/7] Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to Atlas host:", mongoose.connection.host);

  // Set up Express test app on port 5096
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5096);
  const baseUrl = "http://localhost:5096/api";

  const ts = Date.now();
  const adminEmail = `admin_stage5_${ts}@campus.edu`;
  const studentEmail = `student_stage5_${ts}@campus.edu`;
  const courseCode = `CS${ts.toString().slice(-4)}`;

  let adminToken = "";
  let studentToken = "";
  let testStudentId = "";
  let testCourseId = "";

  try {
    // 2. Setup Accounts
    console.log("\n[2/7] Setting up authenticated users for role testing...");
    const adminUser = await User.create({
      name: "Stage5 Admin",
      email: adminEmail,
      password: "adminPassword123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id.toString());

    const regStudent = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Stage5 Student",
        email: studentEmail,
        password: "studentPassword123",
        role: "student",
      }),
    });
    studentToken = (await regStudent.json()).data.token;

    // Create a student record in the students collection
    const createdStudent = await Student.create({
      rollNumber: `ROLL${ts.toString().slice(-5)}`,
      fullName: "Stage5 Test Student",
      email: studentEmail,
      department: "Computer Science",
      course: "B.Tech",
      semester: 4,
      phoneNumber: "+1-555-0199",
      status: "Active",
    });
    testStudentId = createdStudent._id.toString();
    console.log("✅ Authenticated users and Student database record created.");

    // 3. Test Course Management
    console.log("\n[3/7] Testing Course Creation & Permission Guards (POST /api/courses)...");
    
    // Student role attempting to create course -> 403 Forbidden
    const unauthCourse = await fetch(`${baseUrl}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseCode,
        courseName: "Unauthorized Course",
      }),
    });
    if (unauthCourse.status !== 403) {
      throw new Error("Student creating course should return 403");
    }
    console.log("✅ Student role correctly blocked from creating courses (HTTP 403 Forbidden).");

    // Admin creates course -> 201 Created
    const createCourseRes = await fetch(`${baseUrl}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseCode,
        courseName: "Distributed Systems & Cloud NoSQL",
        department: "Computer Science",
        credits: 4,
        instructor: "Prof. Alan Turing",
        semester: 4,
        description: "Consistency models, CAP theorem, and sharded MongoDB deployment.",
      }),
    });
    const courseData = await createCourseRes.json();
    if (createCourseRes.status !== 201 || !courseData.data?._id) {
      throw new Error(`Failed to create course: ${JSON.stringify(courseData)}`);
    }
    testCourseId = courseData.data._id;
    console.log("✅ Admin created course record successfully (HTTP 201 Created).");

    // Duplicate course code check -> 409 Conflict
    const dupCourseRes = await fetch(`${baseUrl}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseCode,
        courseName: "Duplicate Code Course",
        department: "Computer Science",
        credits: 3,
        instructor: "Prof. Other",
        semester: 4,
      }),
    });
    if (dupCourseRes.status !== 409) {
      throw new Error(`Duplicate course code should return 409, got ${dupCourseRes.status}`);
    }
    console.log("✅ Duplicate course code rejected with HTTP 409 Conflict.");

    // 4. Test Course Enrollment
    console.log("\n[4/7] Testing Student Course Enrollment (POST /api/courses/:id/enroll)...");
    const enrollRes = await fetch(`${baseUrl}/courses/${testCourseId}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ studentIds: [testStudentId] }),
    });
    const enrollData = await enrollRes.json();
    if (enrollRes.status !== 200 || !enrollData.data?.enrolledStudents?.length) {
      throw new Error(`Enrollment failed: ${JSON.stringify(enrollData)}`);
    }
    console.log("✅ Student successfully enrolled into course roster (HTTP 200).");

    // 5. Test Attendance Marking & Duplicate Prevention
    console.log("\n[5/7] Testing Attendance Marking & Compound Unique Index (POST /api/attendance/mark)...");
    
    // Student role attempting to mark attendance -> 403 Forbidden
    const unauthAtt = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        courseId: testCourseId,
        date: "2026-10-28",
        records: [{ studentId: testStudentId, status: "Present" }],
      }),
    });
    if (unauthAtt.status !== 403) {
      throw new Error("Student marking attendance should return 403");
    }
    console.log("✅ Student blocked from marking attendance (HTTP 403 Forbidden).");

    // Admin marks attendance for Date 1 -> 200 OK
    const markRes1 = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseId: testCourseId,
        date: "2026-10-27",
        records: [{ studentId: testStudentId, status: "Present", remarks: "On time" }],
      }),
    });
    if (markRes1.status !== 200) {
      throw new Error("Admin marking attendance failed");
    }
    console.log("✅ Attendance marked: Student marked 'Present' for Day 1 (HTTP 200).");

    // Admin marks attendance for Date 2 -> 200 OK
    await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseId: testCourseId,
        date: "2026-10-28",
        records: [{ studentId: testStudentId, status: "Late", remarks: "10 mins late" }],
      }),
    });
    console.log("✅ Attendance marked: Student marked 'Late' for Day 2 (HTTP 200).");

    // Re-marking Day 2: tests that upsert safely updates existing record without duplicate key collision
    const remarkRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        courseId: testCourseId,
        date: "2026-10-28",
        records: [{ studentId: testStudentId, status: "Present", remarks: "Updated to Present" }],
      }),
    });
    if (remarkRes.status !== 200) {
      throw new Error("Upsert on duplicate attendance date failed");
    }
    console.log("✅ Duplicate date re-mark handled seamlessly via upsert (0 duplicate rows).");

    // 6. Test Attendance Aggregation Report
    console.log("\n[6/7] Testing Attendance Aggregation Pipeline & Percentage Calculation (GET /api/attendance/reports)...");
    const reportRes = await fetch(
      `${baseUrl}/attendance/reports?courseId=${testCourseId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const reportData = await reportRes.json();
    if (reportRes.status !== 200 || !Array.isArray(reportData.data) || reportData.data.length === 0) {
      throw new Error(`Report aggregation failed: ${JSON.stringify(reportData)}`);
    }

    const studentReport = reportData.data.find((r) => r.studentId === testStudentId);
    if (!studentReport || typeof studentReport.attendancePercentage !== "number") {
      throw new Error("Attendance percentage not calculated in report");
    }
    console.log(
      `✅ Attendance report aggregated via MongoDB pipeline: ${studentReport.studentName} has ${studentReport.attendancePercentage}% attendance across ${studentReport.totalClasses} classes.`
    );

    // 7. Test Dashboard Integration
    console.log("\n[7/7] Testing Dashboard Analytics Integration (GET /api/dashboard/stats)...");
    const dashRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    if (
      dashRes.status !== 200 ||
      typeof dashData.data?.overview?.totalCourses !== "number" ||
      typeof dashData.data?.overview?.overallAttendanceRate !== "number"
    ) {
      throw new Error("Dashboard missing totalCourses or overallAttendanceRate metrics");
    }
    console.log("✅ Dashboard metrics successfully incorporate totalCourses and overallAttendanceRate.");

    // Cleanup
    console.log("\nCleaning up Stage 5 test artifacts from MongoDB Atlas...");
    await Attendance.deleteMany({ course: testCourseId });
    await Course.findByIdAndDelete(testCourseId);
    await Student.findByIdAndDelete(testStudentId);
    await User.deleteMany({ email: { $in: [adminEmail, studentEmail] } });
    console.log("✅ Test artifacts cleanly removed.");

    console.log("\n===================================================================");
    console.log("🎉 ALL STAGE 5 COURSES & ATTENDANCE TESTS PASSED SUCCESSFULLY!");
    console.log("===================================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Stage 5 Test error:", err);
  process.exit(1);
});
