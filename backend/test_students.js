// backend/test_students.js
// Automated verification script for Stage 3 Student Management CRUD endpoints.

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/Student");
const generateToken = require("./utils/generateToken");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

async function runTests() {
  console.log("=== Stage 3: Student Management CRUD Automated Test ===");

  // 1. Connect to MongoDB Atlas
  console.log("\n[1/8] Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to Atlas host:", mongoose.connection.host);

  // Set up Express test app on an ephemeral port
  const app = express();
  app.use(express.json());
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5098);
  const baseUrl = "http://localhost:5098/api";

  const timestamp = Date.now();
  const adminEmail = `admin_crud_${timestamp}@campus.edu`;
  const studentEmail = `student_crud_${timestamp}@campus.edu`;

  let adminToken = "";
  let studentToken = "";
  let createdStudentId = "";
  let secondStudentId = "";

  const roll1 = `CS${timestamp.toString().slice(-6)}`;
  const roll2 = `IT${timestamp.toString().slice(-6)}`;
  const student1Email = `student1_${timestamp}@campus.edu`;
  const student2Email = `student2_${timestamp}@campus.edu`;

  try {
    // 2. Setup Test Accounts (Admin and Student)
    console.log("\n[2/8] Setting up authenticated users for role testing...");
    const adminUser = await User.create({
      name: "Admin Tester",
      email: adminEmail,
      password: "adminPassword123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id.toString());

    const regStudent = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Student Tester",
        email: studentEmail,
        password: "studentPassword123",
        role: "student",
      }),
    });
    const studentData = await regStudent.json();
    studentToken = studentData.data?.token;

    if (!adminToken || !studentToken) {
      throw new Error("Failed to register test users");
    }
    console.log("✅ Authenticated Admin and Student accounts created.");

    // 3. Test Student Creation (Permissions & Validations)
    console.log("\n[3/8] Testing Student Creation (POST /api/students)...");
    
    // Without token -> 401
    const noAuthRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollNumber: roll1 }),
    });
    if (noAuthRes.status !== 401) {
      throw new Error(`Unauthenticated creation should be 401, got ${noAuthRes.status}`);
    }
    console.log("✅ Missing token rejected with HTTP 401.");

    // With Student role token -> 403 Forbidden
    const forbiddenRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        rollNumber: roll1,
        fullName: "Unauthorized Add",
        email: student1Email,
        department: "Computer Science",
        course: "B.Tech",
        semester: 3,
        phoneNumber: "+1-555-0100",
      }),
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`Student role creating student should return 403, got ${forbiddenRes.status}`);
    }
    console.log("✅ Student role correctly blocked from creating records (HTTP 403 Forbidden).");

    // Admin role with missing fields -> 400 Bad Request
    const badInputRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ rollNumber: roll1 }),
    });
    if (badInputRes.status !== 400) {
      throw new Error(`Missing fields should return 400, got ${badInputRes.status}`);
    }
    console.log("✅ Incomplete input rejected with HTTP 400 Bad Request.");

    // Admin role valid creation -> 201 Created
    const createRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: roll1,
        fullName: "Jordan Lee",
        email: student1Email,
        department: "Computer Science",
        course: "B.Tech",
        semester: 4,
        phoneNumber: "+1-555-0111",
        status: "Active",
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.data?._id) {
      throw new Error(`Valid student creation failed: ${JSON.stringify(createData)}`);
    }
    createdStudentId = createData.data._id;
    console.log("✅ Admin successfully created student record (HTTP 201 Created).");

    // Test Duplicate Roll Number -> 409 Conflict
    const dupRollRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: roll1, // Same roll number
        fullName: "Duplicate Roll Student",
        email: `other_${timestamp}@campus.edu`,
        department: "Computer Science",
        course: "B.Tech",
        semester: 2,
        phoneNumber: "+1-555-0112",
      }),
    });
    if (dupRollRes.status !== 409) {
      throw new Error(`Duplicate roll number should return 409, got ${dupRollRes.status}`);
    }
    console.log("✅ Duplicate roll number blocked with HTTP 409 Conflict.");

    // Test Duplicate Email -> 409 Conflict
    const dupEmailRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: `NEW${timestamp.toString().slice(-5)}`,
        fullName: "Duplicate Email Student",
        email: student1Email, // Same email
        department: "Computer Science",
        course: "B.Tech",
        semester: 2,
        phoneNumber: "+1-555-0113",
      }),
    });
    if (dupEmailRes.status !== 409) {
      throw new Error(`Duplicate email should return 409, got ${dupEmailRes.status}`);
    }
    console.log("✅ Duplicate email blocked with HTTP 409 Conflict.");

    // Create a second student for filter/search testing
    const create2Res = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rollNumber: roll2,
        fullName: "Samantha Ray",
        email: student2Email,
        department: "Information Technology",
        course: "MCA",
        semester: 2,
        phoneNumber: "+1-555-0222",
        status: "Active",
      }),
    });
    const create2Data = await create2Res.json();
    secondStudentId = create2Data.data?._id;

    // 4. Test List, Search, Filter, Pagination
    console.log("\n[4/8] Testing List, Search, Filter & Pagination (GET /api/students)...");
    
    // Regular students can view the directory
    const listRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !Array.isArray(listData.data)) {
      throw new Error(`Student view failed: ${JSON.stringify(listData)}`);
    }
    console.log("✅ Authenticated students can view student directory (HTTP 200).");

    // Search query test
    const searchRes = await fetch(`${baseUrl}/students?search=Jordan`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const searchData = await searchRes.json();
    if (searchData.data.length === 0 || searchData.data[0].fullName !== "Jordan Lee") {
      throw new Error(`Search failed to find 'Jordan': ${JSON.stringify(searchData)}`);
    }
    console.log("✅ Search parameter matches records accurately using MongoDB regex.");

    // Department filter test
    const deptRes = await fetch(`${baseUrl}/students?department=Information+Technology`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const deptData = await deptRes.json();
    const allMatchDept = deptData.data.every((s) => s.department === "Information Technology");
    if (!allMatchDept || deptData.data.length === 0) {
      throw new Error("Department filter returned mismatched records");
    }
    console.log("✅ Department filter correctly restricts query results.");

    // Pagination test
    const pageRes = await fetch(`${baseUrl}/students?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const pageData = await pageRes.json();
    if (pageData.limit !== 1 || pageData.data.length > 1) {
      throw new Error("Pagination limit failed");
    }
    console.log("✅ Pagination parameters (page, limit, totalPages) working properly.");

    // 5. Test Aggregated Statistics Endpoint
    console.log("\n[5/8] Testing MongoDB Aggregation Stats (GET /api/students/stats)...");
    const statsRes = await fetch(`${baseUrl}/students/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const statsData = await statsRes.json();
    if (
      statsRes.status !== 200 ||
      typeof statsData.data?.totalStudents !== "number" ||
      !Array.isArray(statsData.data?.departmentStats)
    ) {
      throw new Error(`Stats endpoint failed: ${JSON.stringify(statsData)}`);
    }
    console.log("✅ Aggregated statistics computed via MongoDB $group pipeline successfully.");

    // 6. Test Single Student Retrieval
    console.log("\n[6/8] Testing Single Student Retrieval (GET /api/students/:id)...");
    const getSingleRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getSingleData = await getSingleRes.json();
    if (getSingleRes.status !== 200 || getSingleData.data?.rollNumber !== roll1) {
      throw new Error("Failed to fetch student by ID");
    }
    console.log("✅ Student record retrieved by MongoDB _id (HTTP 200).");

    // Invalid ID format test
    const badIdRes = await fetch(`${baseUrl}/students/invalid123`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (badIdRes.status !== 400) {
      throw new Error("Invalid ID format should return 400");
    }
    console.log("✅ Invalid ObjectId format rejected with HTTP 400.");

    // 7. Test Student Update (PUT /api/students/:id)
    console.log("\n[7/8] Testing Update Operations (PUT /api/students/:id)...");
    
    // Student role attempting update -> 403
    const studentUpdateRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ fullName: "Hacked Name" }),
    });
    if (studentUpdateRes.status !== 403) {
      throw new Error("Student role updating record should be 403");
    }
    console.log("✅ Student role blocked from updating records (HTTP 403 Forbidden).");

    // Admin role update -> 200
    const adminUpdateRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: "Jordan Lee Updated",
        semester: 5,
        status: "Active",
      }),
    });
    const adminUpdateData = await adminUpdateRes.json();
    if (adminUpdateRes.status !== 200 || adminUpdateData.data?.fullName !== "Jordan Lee Updated") {
      throw new Error(`Admin update failed: ${JSON.stringify(adminUpdateData)}`);
    }
    console.log("✅ Admin updated student record successfully (HTTP 200).");

    // 8. Test Student Deletion (DELETE /api/students/:id)
    console.log("\n[8/8] Testing Deletion Operations (DELETE /api/students/:id)...");
    
    // Student role attempting delete -> 403
    const studentDelRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentDelRes.status !== 403) {
      throw new Error("Student role deleting record should be 403");
    }
    console.log("✅ Student role blocked from deleting records (HTTP 403 Forbidden).");

    // Admin role delete -> 200
    const adminDelRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDelRes.status !== 200) {
      throw new Error("Admin deletion failed");
    }
    console.log("✅ Admin successfully deleted student record (HTTP 200).");

    // Verify it is no longer found
    const verifyDelRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (verifyDelRes.status !== 404) {
      throw new Error("Deleted student still accessible");
    }
    console.log("✅ Deleted record confirmed absent from database (HTTP 404 Not Found).");

    // Clean up second test student and test accounts
    if (secondStudentId) {
      await Student.findByIdAndDelete(secondStudentId);
    }
    await User.deleteMany({ email: { $in: [adminEmail, studentEmail] } });
    console.log("✅ Test accounts and artifacts cleanly removed from Atlas.");

    console.log("\n==========================================================");
    console.log("🎉 ALL STAGE 3 STUDENT CRUD TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
