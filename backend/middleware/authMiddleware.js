// middleware/authMiddleware.js
// Provides two middleware functions for protecting Express routes:
//
//   protect    — Verifies the JWT sent in the Authorization header.
//                Attaches the decoded user to req.user for downstream use.
//
//   adminOnly  — Must be used AFTER protect.
//                Rejects the request if the user's role is not 'admin'.
//
// Usage in routes:
//   router.get("/secret", protect, adminOnly, controller);
//   router.get("/profile", protect, controller);

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");

// ── protect ───────────────────────────────────────────────────────────────────
// Extracts the JWT from the Authorization header and validates it.
// Expected header format:  Authorization: Bearer <token>
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check that the Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Split "Bearer eyJ..." and take the second part (the token itself)
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token was found, reject immediately
  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  // Verify the token's signature using JWT_SECRET from .env.
  // jwt.verify throws an error if the token is expired or tampered with.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch the user from MongoDB using the _id embedded in the token payload.
  // We exclude the password field (select: false is default, but explicit here).
  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized — user no longer exists");
  }

  if (decoded.role && decoded.role !== req.user.role) {
    res.status(401);
    throw new Error("Session role changed. Please sign in again.");
  }

  if (req.user.role === "student") {
    const student = await Student.findOne({ email: req.user.email }).select(
      "status"
    );
    if (student && student.status !== "Active") {
      res.status(403);
      throw new Error("This student account is inactive. Contact an administrator.");
    }
  }

  next(); // User is authenticated — pass control to the next handler
});

// ── adminOnly ─────────────────────────────────────────────────────────────────
// Must be placed AFTER protect in the middleware chain.
// protect populates req.user; adminOnly then checks the role.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Role is admin — allow through
  } else {
    res.status(403); // 403 Forbidden (authenticated but not authorised)
    throw new Error("Access denied — admin only");
  }
};

module.exports = { protect, adminOnly };
