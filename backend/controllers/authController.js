// controllers/authController.js
// Handles all authentication-related business logic.
// Each function is an Express route handler: (req, res) => { ... }
// Wrapped with asyncHandler so any thrown error flows to errorMiddleware.
//
// Functions exported:
//   registerUser  — POST /api/auth/register
//   loginUser     — POST /api/auth/login
//   getMe         — GET  /api/auth/me  (protected)

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const generateToken = require("../utils/generateToken");

// ── registerUser ──────────────────────────────────────────────────────────────
// Creates a new user account.
// The password is hashed automatically by the User model's pre-save hook.
// Returns the new user's public profile + a JWT.
//
// Request body: { name, email, password, role? }
// Public registration always creates a student; role values from the client
// cannot be used to grant administrative privileges.
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // ── Input Validation ───────────────────────────────────────────────────────
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  if (role && role !== "student") {
    res.status(403);
    throw new Error("Public registration is limited to student accounts");
  }

  // ── Duplicate Check ────────────────────────────────────────────────────────
  // MongoDB's unique index on email would also catch this,
  // but checking manually gives a cleaner error message.
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409); // 409 Conflict
    throw new Error("An account with this email already exists");
  }

  // ── Create User ────────────────────────────────────────────────────────────
  // User.create() calls .save() internally, which triggers the bcrypt pre-save hook.
  // The plain-text password in req.body is never written to MongoDB.
  const user = await User.create({
    name,
    email: normalizedEmail,
    password, // Will be hashed by the pre-save hook in User.js
    role: "student",
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        token: generateToken(user._id.toString(), user.role), // JWT for immediate use
      },
    });
  } else {
    res.status(500);
    throw new Error("Failed to create user account");
  }
});

// ── loginUser ─────────────────────────────────────────────────────────────────
// Authenticates an existing user.
// Fetches the user by email, then uses bcrypt.compare (via matchPassword)
// to verify the submitted password against the stored hash.
//
// Request body: { email, password }
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // ── Input Validation ───────────────────────────────────────────────────────
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }
  if (role && !["student", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Role must be either student or admin");
  }

  // ── Find User ──────────────────────────────────────────────────────────────
  // We must use .select("+password") because the password field has
  // select:false in the schema — it's excluded from queries by default.
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password"
  );

  // ── Verify Password ────────────────────────────────────────────────────────
  // We check both conditions in one if-block intentionally.
  // This prevents a timing attack: an attacker can't distinguish between
  // "user not found" and "wrong password" from the response.
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (role && user.role !== role) {
    res.status(403);
    throw new Error(`This account is not registered as ${role}`);
  }

  if (user.role === "student") {
    const student = await Student.findOne({ email: user.email }).select("status");
    if (student && student.status !== "Active") {
      res.status(403);
      throw new Error("This student account is inactive. Contact an administrator.");
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  res.json({
    success: true,
    message: "Login successful",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    },
  });
});

// ── getMe ─────────────────────────────────────────────────────────────────────
// Returns the currently logged-in user's profile.
// The 'protect' middleware already verified the JWT and populated req.user,
// so this controller just returns that data.
//
// This is used by the frontend on page load to restore auth state.
const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by the protect middleware
  res.json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = { registerUser, loginUser, getMe };
