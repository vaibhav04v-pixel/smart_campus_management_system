// routes/authRoutes.js
// Defines the URL endpoints for authentication.
// Each route maps an HTTP method + path to a controller function.
//
// Route summary:
//   POST   /api/auth/register  — Create a new account (public)
//   POST   /api/auth/login     — Login and receive JWT (public)
//   GET    /api/auth/me        — Get current user profile (protected)
//
// The protect middleware is inserted between the path and controller
// for the /me route. Express calls middleware left-to-right:
//   protect runs first → validates JWT → then getMe runs.

const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes — no token required
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route — requires valid JWT in Authorization header
router.get("/me", protect, getMe);

// Admin-only route — requires valid JWT AND admin role
router.get("/admin-check", protect, adminOnly, (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted — role verified successfully",
    user: req.user,
  });
});

module.exports = router;
