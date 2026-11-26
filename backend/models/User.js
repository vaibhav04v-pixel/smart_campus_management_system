// models/User.js
// Mongoose schema for the 'users' collection in MongoDB Atlas.
//
// Key design decisions:
//   1. Passwords are NEVER stored as plain text.
//      A Mongoose pre-save hook hashes them with bcrypt automatically.
//   2. Role-based access: every user is either 'admin' or 'student'.
//      The backend middleware checks this role to protect routes.
//   3. The 'select: false' on password means it is excluded from
//      query results by default — you must explicitly opt-in with .select('+password').

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,               // MongoDB creates a unique index on this field
      lowercase: true,            // Always stored as lowercase to avoid duplicates
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,              // Excluded from query results unless explicitly requested
    },

    role: {
      type: String,
      enum: {
        values: ["student", "admin"],
        message: "Role must be either 'student' or 'admin'",
      },
      default: "student",
    },

    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// ── Pre-Save Hook ─────────────────────────────────────────────────────────────
// This function runs automatically BEFORE every .save() call.
// It hashes the password only when it has been modified (or is new).
// This prevents re-hashing an already-hashed password on profile updates.
userSchema.pre("save", async function () {
  // 'this' refers to the document being saved
  if (!this.isModified("password")) {
    return; // Password unchanged — skip hashing
  }

  // saltRounds = 10 means bcrypt performs 2^10 = 1024 hashing rounds.
  // Higher = more secure but slower. 10 is the industry-standard default.
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// ── Instance Method ────────────────────────────────────────────────────────────
// Attaches a custom method to every User document.
// Called during login to compare the submitted plain-text password
// against the stored bcrypt hash. Returns true if they match.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare hashes the entered password the same way and compares
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
