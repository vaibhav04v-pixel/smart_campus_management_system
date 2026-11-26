// backend/test_stage4.js
// Automated verification script for Stage 4: Complaints, Events, Announcements, and Dashboard Aggregations.

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const express = require("express");
const User = require("./models/User");
const generateToken = require("./utils/generateToken");
const Complaint = require("./models/Complaint");
const Event = require("./models/Event");
const Announcement = require("./models/Announcement");
const Student = require("./models/Student");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const eventRoutes = require("./routes/eventRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

async function runTests() {
  console.log("=== Stage 4: Complaints, Events, Notices & Analytics Automated Test ===");

  // 1. Connect to MongoDB Atlas
  console.log("\n[1/7] Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to Atlas host:", mongoose.connection.host);

  // Set up Express test app on port 5097
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5097);
  const baseUrl = "http://localhost:5097/api";

  const ts = Date.now();
  const adminEmail = `admin_stage4_${ts}@campus.edu`;
  const studentEmail = `student_stage4_${ts}@campus.edu`;

  let adminToken = "";
  let studentToken = "";
  let testComplaintId = "";
  let testEventId = "";
  let testAnnouncementId = "";

  try {
    // 2. Authentication setup
    console.log("\n[2/7] Authenticating test Admin and Student accounts...");
    const adminUser = await User.create({
      name: "Stage4 Admin",
      email: adminEmail,
      password: "adminPassword123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id.toString());

    const regStudent = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Stage4 Student",
        email: studentEmail,
        password: "studentPassword123",
        role: "student",
      }),
    });
    studentToken = (await regStudent.json()).data.token;
    console.log("✅ Authentication tokens acquired.");

    // 3. Test Complaints Module
    console.log("\n[3/7] Testing Complaints Submission, Role Isolation & Status Resolution...");
    
    // Student submits complaint
    const compRes = await fetch(`${baseUrl}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Air conditioning malfunctioning in Library 2nd Floor",
        description: "The AC unit in the quiet study area has stopped cooling and is making loud noises.",
        category: "Infrastructure",
        priority: "High",
      }),
    });
    const compData = await compRes.json();
    if (compRes.status !== 201 || !compData.data?._id) {
      throw new Error(`Failed to lodge complaint: ${JSON.stringify(compData)}`);
    }
    testComplaintId = compData.data._id;
    console.log("✅ Student lodged complaint successfully (HTTP 201 Created).");

    // Student fetches own complaints
    const studentCompList = await fetch(`${baseUrl}/complaints`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentCompData = await studentCompList.json();
    if (studentCompData.data.length === 0) {
      throw new Error("Student failed to view own complaints");
    }
    console.log("✅ Student retrieves own complaints correctly.");

    // Student attempts to update status -> 403 Forbidden
    const unauthStatus = await fetch(`${baseUrl}/complaints/${testComplaintId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ status: "Resolved" }),
    });
    if (unauthStatus.status !== 403) {
      throw new Error("Student updating complaint status should return 403");
    }
    console.log("✅ Student blocked from modifying complaint resolution status (HTTP 403).");

    // Admin updates complaint status -> 200 OK
    const adminStatus = await fetch(`${baseUrl}/complaints/${testComplaintId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "Resolved",
        adminNotes: "Maintenance team repaired the AC condenser unit.",
      }),
    });
    const adminStatusData = await adminStatus.json();
    if (adminStatus.status !== 200 || adminStatusData.data.status !== "Resolved") {
      throw new Error("Admin status update failed");
    }
    console.log("✅ Admin updated status to 'Resolved' with resolution notes (HTTP 200).");

    // 4. Test Events Module
    console.log("\n[4/7] Testing Events Creation, Registrations & Capacity Management...");
    
    // Student attempts to create event -> 403 Forbidden
    const unauthEvent = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ title: "Unauthorized Event" }),
    });
    if (unauthEvent.status !== 403) {
      throw new Error("Student creating event should return 403");
    }
    console.log("✅ Student blocked from creating events (HTTP 403 Forbidden).");

    // Admin creates event -> 201 Created
    const createEventRes = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Cloud Computing & NoSQL Workshop 2026",
        description: "Hands-on session exploring MongoDB Atlas aggregation pipelines and full stack design.",
        category: "Technical",
        venue: "Seminar Hall 1",
        date: new Date(Date.now() + 86400000 * 7).toISOString(),
        time: "10:00 AM - 1:00 PM",
        capacity: 60,
      }),
    });
    const eventData = await createEventRes.json();
    if (createEventRes.status !== 201 || !eventData.data?._id) {
      throw new Error(`Failed to create event: ${JSON.stringify(eventData)}`);
    }
    testEventId = eventData.data._id;
    console.log("✅ Admin scheduled new event (HTTP 201 Created).");

    // Student registers for event
    const regEventRes = await fetch(`${baseUrl}/events/${testEventId}/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const regEventData = await regEventRes.json();
    if (regEventRes.status !== 200 || !regEventData.data.isRegistered) {
      throw new Error("Event registration failed");
    }
    console.log("✅ Student registered for event successfully (HTTP 200).");

    // Student duplicate registration -> 409 Conflict
    const dupRegEvent = await fetch(`${baseUrl}/events/${testEventId}/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (dupRegEvent.status !== 409) {
      throw new Error("Duplicate registration should return 409");
    }
    console.log("✅ Duplicate event registration blocked with HTTP 409 Conflict.");

    // 5. Test Announcements Module
    console.log("\n[5/7] Testing Campus Bulletins & Announcements...");
    
    // Student attempts to publish notice -> 403
    const unauthNotice = await fetch(`${baseUrl}/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ title: "Spam notice" }),
    });
    if (unauthNotice.status !== 403) {
      throw new Error("Student posting notice should return 403");
    }
    console.log("✅ Student blocked from publishing notices (HTTP 403 Forbidden).");

    // Admin publishes notice -> 201 Created
    const createNoticeRes = await fetch(`${baseUrl}/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Campus Library Extended Hours for Finals",
        content: "The Central Library will remain open 24/7 starting next Monday through exam week.",
        category: "Academic",
        priority: "High",
        targetAudience: "All",
      }),
    });
    const noticeData = await createNoticeRes.json();
    if (createNoticeRes.status !== 201 || !noticeData.data?._id) {
      throw new Error(`Failed to post notice: ${JSON.stringify(noticeData)}`);
    }
    testAnnouncementId = noticeData.data._id;
    console.log("✅ Admin published notice successfully (HTTP 201 Created).");

    // Users list announcements
    const listNotices = await fetch(`${baseUrl}/announcements`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const noticesList = await listNotices.json();
    if (noticesList.status !== 200 && !Array.isArray(noticesList.data)) {
      throw new Error("Failed to list notices");
    }
    console.log("✅ Authenticated users can browse campus notices board.");

    // 6. Test Live Dashboard Aggregation Analytics
    console.log("\n[6/7] Testing Dashboard MongoDB Aggregation Analytics (GET /api/dashboard/stats)...");
    const dashRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    if (
      dashRes.status !== 200 ||
      typeof dashData.data?.overview?.totalComplaints !== "number" ||
      typeof dashData.data?.overview?.upcomingEventsCount !== "number" ||
      !Array.isArray(dashData.data?.charts?.departmentBreakdown)
    ) {
      throw new Error(`Dashboard aggregation failed: ${JSON.stringify(dashData)}`);
    }
    console.log("✅ Dashboard live analytics successfully aggregated from MongoDB Atlas collections.");

    // 7. Cleanup
    console.log("\n[7/7] Cleaning up test artifacts from MongoDB Atlas...");
    if (testComplaintId) await Complaint.findByIdAndDelete(testComplaintId);
    if (testEventId) await Event.findByIdAndDelete(testEventId);
    if (testAnnouncementId) await Announcement.findByIdAndDelete(testAnnouncementId);
    await User.deleteMany({ email: { $in: [adminEmail, studentEmail] } });
    console.log("✅ Test artifacts and user records cleanly removed.");

    console.log("\n===================================================================");
    console.log("🎉 ALL STAGE 4 COMPLAINTS, EVENTS & ANALYTICS TESTS PASSED!");
    console.log("===================================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Stage 4 Test error:", err);
  process.exit(1);
});
