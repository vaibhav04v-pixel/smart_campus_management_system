require("dotenv").config();

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

const { app } = require("./server");
const User = require("./models/User");
const Student = require("./models/Student");
const Course = require("./models/Course");
const Attendance = require("./models/Attendance");
const Complaint = require("./models/Complaint");
const Event = require("./models/Event");
const Announcement = require("./models/Announcement");

const databaseName = `scms_portals_test_${crypto.randomBytes(8).toString("hex")}`;
const adminPassword = crypto.randomBytes(24).toString("base64url");
const studentPassword = crypto.randomBytes(24).toString("base64url");
const registrationPassword = crypto.randomBytes(24).toString("base64url");
let server;
let baseUrl;
let databaseCreated = false;

const request = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  return { status: response.status, data };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run the isolated portal integration test.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000,
  });
  databaseCreated = true;

  const admin = await User.create({
    name: "Portal Test Admin",
    email: `admin-${databaseName}@example.test`,
    password: adminPassword,
    role: "admin",
  });
  const studentUser = await User.create({
    name: "Portal Test Student",
    email: `student-${databaseName}@example.test`,
    password: studentPassword,
    role: "student",
  });
  const student = await Student.create({
    rollNumber: "PORTAL-TEST-01",
    fullName: studentUser.name,
    email: studentUser.email,
    department: "Computer Science",
    course: "B.Tech",
    semester: 4,
    phoneNumber: "555-0101",
    status: "Active",
  });

  server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const health = await request("/health");
  assert.equal(health.status, 200, "health endpoint");
  assert.equal(health.data.database, "connected");

  const studentLogin = await request("/auth/login", {
    method: "POST",
    body: { email: studentUser.email, password: studentPassword, role: "student" },
  });
  assert.equal(studentLogin.status, 200, "student login");
  assert.equal(studentLogin.data.data.role, "student");

  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: { email: admin.email, password: adminPassword, role: "admin" },
  });
  assert.equal(adminLogin.status, 200, "admin login");
  assert.equal(adminLogin.data.data.role, "admin");

  const studentToken = studentLogin.data.data.token;
  const adminToken = adminLogin.data.data.token;

  const forbiddenRegistration = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Public Admin",
      email: `public-admin-${databaseName}@example.test`,
      password: registrationPassword,
      role: "admin",
    },
  });
  assert.equal(forbiddenRegistration.status, 403, "public admin registration is rejected");

  const registrationEmail = `registered-${databaseName}@example.test`;
  const studentRegistration = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Registered Test Student",
      email: registrationEmail,
      password: registrationPassword,
    },
  });
  assert.equal(studentRegistration.status, 201, "public student registration");
  const registeredUser = await User.findOne({ email: registrationEmail }).select("+password");
  assert.notEqual(registeredUser.password, registrationPassword, "password is stored hashed");
  assert.equal(await registeredUser.matchPassword(registrationPassword), true);

  const studentAdminStats = await request("/dashboard/stats", { token: studentToken });
  assert.equal(studentAdminStats.status, 403, "student cannot access admin dashboard API");
  const studentCourseWrite = await request("/courses", {
    method: "POST",
    token: studentToken,
    body: {},
  });
  assert.equal(studentCourseWrite.status, 403, "student cannot create courses");
  const adminStats = await request("/dashboard/stats", { token: adminToken });
  assert.equal(adminStats.status, 200, "admin can access dashboard API");
  const adminStudentDirectory = await request("/students", { token: adminToken });
  assert.equal(adminStudentDirectory.status, 200, "admin can access student management");

  const createdCourse = await request("/courses", {
    method: "POST",
    token: adminToken,
    body: {
      courseCode: "TEST-CS401",
      courseName: "Portal Integration Testing",
      department: "Computer Science",
      credits: 3,
      instructor: "Test Instructor",
      semester: 4,
    },
  });
  assert.equal(createdCourse.status, 201, "admin creates a course");
  const courseId = createdCourse.data.data._id;

  const enrollment = await request(`/courses/${courseId}/enroll`, {
    method: "POST",
    token: adminToken,
    body: { studentIds: [student._id.toString()] },
  });
  assert.equal(enrollment.status, 200, "admin assigns student to course");

  const attendanceMark = await request("/attendance/mark", {
    method: "POST",
    token: adminToken,
    body: {
      courseId,
      date: "2026-04-20",
      records: [
        { studentId: student._id.toString(), status: "Present" },
      ],
    },
  });
  assert.equal(attendanceMark.status, 200, "admin records attendance");

  const complaintResponse = await request("/complaints", {
    method: "POST",
    token: studentToken,
    body: {
      title: "Test library access issue",
      description: "Portal integration test complaint for verifying status updates.",
      category: "Library",
      priority: "Medium",
    },
  });
  assert.equal(complaintResponse.status, 201, "student submits a complaint");
  const complaintId = complaintResponse.data.data._id;

  const statusResponse = await request(`/complaints/${complaintId}/status`, {
    method: "PUT",
    token: adminToken,
    body: { status: "In Progress", adminNotes: "A staff member is reviewing this." },
  });
  assert.equal(statusResponse.status, 200, "admin updates complaint status");
  assert.equal(statusResponse.data.data.status, "In Progress");

  const createdEvent = await request("/events", {
    method: "POST",
    token: adminToken,
    body: {
      title: "Portal test event",
      description: "An upcoming event created for dashboard integration testing.",
      category: "Technical",
      venue: "Test Hall",
      date: "2030-05-01",
      time: "10:00 AM",
      capacity: 25,
    },
  });
  assert.equal(createdEvent.status, 201, "admin creates an event");

  const createdAnnouncement = await request("/announcements", {
    method: "POST",
    token: adminToken,
    body: {
      title: "Portal test announcement",
      content: "An active announcement created for student dashboard testing.",
      category: "Academic",
      targetAudience: "Students",
    },
  });
  assert.equal(createdAnnouncement.status, 201, "admin publishes an announcement");

  const studentDashboard = await request("/dashboard/student", { token: studentToken });
  assert.equal(studentDashboard.status, 200, "student dashboard API");
  assert.equal(studentDashboard.data.data.overview.enrolledCourseCount, 1);
  assert.equal(studentDashboard.data.data.overview.attendancePercentage, 100);
  assert.equal(studentDashboard.data.data.overview.totalComplaints, 1);
  assert.equal(studentDashboard.data.data.overview.pendingComplaints, 1);
  assert.equal(studentDashboard.data.data.upcomingEvents.length, 1);
  assert.equal(studentDashboard.data.data.announcements.length, 1);

  const visibleComplaints = await request("/complaints", { token: studentToken });
  assert.equal(visibleComplaints.status, 200);
  assert.equal(visibleComplaints.data.data[0].status, "In Progress");
  assert.equal(
    visibleComplaints.data.data[0].adminNotes,
    "A staff member is reviewing this."
  );

  const invalidSession = await request("/auth/me", {
    token: jwt.sign({ id: studentUser._id.toString(), role: "student" }, process.env.JWT_SECRET, {
      expiresIn: -1,
    }),
  });
  assert.equal(invalidSession.status, 401, "expired tokens are rejected");

  assert.equal(await Course.countDocuments(), 1);
  assert.equal(await Attendance.countDocuments(), 1);
  assert.equal(await Complaint.countDocuments(), 1);
  assert.equal(await Event.countDocuments(), 1);
  assert.equal(await Announcement.countDocuments(), 1);
  console.log("Portal integration checks passed against an isolated temporary database.");
};

run()
  .catch((error) => {
    const message = error.message.replace(
      /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
      "MongoDB connection URI [redacted]"
    );
    console.error("Portal integration checks failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (databaseCreated) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  });
