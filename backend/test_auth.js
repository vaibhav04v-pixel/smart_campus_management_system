// backend/test_auth.js
// Automated verification script for Stage 2 authentication endpoints.

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const generateToken = require("./utils/generateToken");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

async function runTests() {
  console.log("=== Stage 2: Authentication System Automated Test ===");

  // 1. Connect to MongoDB Atlas
  console.log("\n[1/6] Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to Atlas host:", mongoose.connection.host);

  // Set up Express test app on an ephemeral port
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(5099);
  const baseUrl = "http://localhost:5099/api/auth";
  let testStudentEmail;
  let testAdminEmail;

  try {
    testStudentEmail = `test_student_${Date.now()}@campus.edu`;
    testAdminEmail = `test_admin_${Date.now()}@campus.edu`;

    // 2. Test User Registration (Student)
    console.log("\n[2/6] Testing Registration (POST /api/auth/register)...");
    const regRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: testStudentEmail,
        password: "securePassword123",
        role: "student",
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.data?.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log("✅ Student registered successfully (HTTP 201). Token received.");

    // Verify Password was hashed in MongoDB (not plain text)
    const rawDbUser = await User.findOne({ email: testStudentEmail }).select("+password");
    if (!rawDbUser.password.startsWith("$2a$") && !rawDbUser.password.startsWith("$2b$")) {
      throw new Error("Password in database is NOT hashed with bcrypt!");
    }
    console.log("✅ Password verified as securely bcrypt-hashed in MongoDB.");

    // Test Duplicate Registration
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: testStudentEmail,
        password: "securePassword123",
      }),
    });
    if (dupRes.status !== 409) {
      throw new Error(`Duplicate registration should return 409, got ${dupRes.status}`);
    }
    console.log("✅ Duplicate email registration properly blocked (HTTP 409).");

    // 3. Public registration must not grant admin privileges.
    const regAdminRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Admin",
        email: testAdminEmail,
        password: "adminPassword123",
        role: "admin",
      }),
    });
    if (regAdminRes.status !== 403) {
      throw new Error(`Public admin registration should return 403, got ${regAdminRes.status}`);
    }

    const adminUser = await User.create({
      name: "Test Admin",
      email: testAdminEmail,
      password: "adminPassword123",
      role: "admin",
    });
    const adminToken = generateToken(adminUser._id.toString());
    console.log("✅ Public admin registration blocked; admin fixture created directly.");

    // 4. Test Login
    console.log("\n[3/6] Testing Login (POST /api/auth/login)...");
    // Invalid credentials
    const invalidLoginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: "wrongPassword",
      }),
    });
    if (invalidLoginRes.status !== 401) {
      throw new Error(`Invalid password should return 401, got ${invalidLoginRes.status}`);
    }
    console.log("✅ Invalid password rejected with HTTP 401.");

    // Valid student login
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testStudentEmail,
        password: "securePassword123",
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const studentToken = loginData.data.token;
    console.log("✅ Student login succeeded (HTTP 200). JWT returned.");

    // 5. Test Protected Route (/api/auth/me)
    console.log("\n[4/6] Testing Protected Profile Endpoint (GET /api/auth/me)...");
    // Without token
    const noTokenRes = await fetch(`${baseUrl}/me`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Missing token should return 401, got ${noTokenRes.status}`);
    }
    console.log("✅ Request without token rejected (HTTP 401).");

    // With invalid token
    const invalidTokenRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    if (invalidTokenRes.status !== 401) {
      throw new Error(`Invalid token should return 401, got ${invalidTokenRes.status}`);
    }
    console.log("✅ Invalid token rejected (HTTP 401).");

    // With valid student token
    const studentMeRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentMeData = await studentMeRes.json();
    if (studentMeRes.status !== 200 || studentMeData.data.email !== testStudentEmail) {
      throw new Error(`Failed to retrieve profile: ${JSON.stringify(studentMeData)}`);
    }
    console.log("✅ Profile retrieved successfully with valid token (HTTP 200).");

    // 6. Test Role-Based Guard (/api/auth/admin-check)
    console.log("\n[5/6] Testing Role-Based Authorization Guard (GET /api/auth/admin-check)...");
    // Student token attempting admin-only endpoint
    const studentAdminRes = await fetch(`${baseUrl}/admin-check`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (studentAdminRes.status !== 403) {
      throw new Error(`Student accessing admin route should return 403, got ${studentAdminRes.status}`);
    }
    console.log("✅ Student blocked from admin-only route with HTTP 403 Forbidden.");

    // Admin token accessing admin-only endpoint
    const adminCheckRes = await fetch(`${baseUrl}/admin-check`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminCheckRes.status !== 200) {
      throw new Error(`Admin accessing admin route failed: ${adminCheckRes.status}`);
    }
    console.log("✅ Admin granted access to admin-only route with HTTP 200 OK.");

    console.log("\n========================================================");
    console.log("🎉 ALL STAGE 2 AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
    console.log("========================================================");
  } finally {
    console.log("\n[6/6] Cleaning up test records in MongoDB...");
    if (testStudentEmail || testAdminEmail) {
      await User.deleteMany({
        email: { $in: [testStudentEmail, testAdminEmail].filter(Boolean) },
      });
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
