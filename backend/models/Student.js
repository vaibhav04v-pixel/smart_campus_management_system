// models/Student.js
// Mongoose schema for Student records in MongoDB Atlas.
//
// Key features:
//   - Unique index on rollNumber and email.
//   - String formatting: rollNumber is uppercase, email is lowercase.
//   - Validation for phone number and semester range.
//   - Timestamps automatically track createdAt and updatedAt.

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Roll number must be at least 3 characters"],
      maxlength: [20, "Roll number cannot exceed 20 characters"],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [60, "Full name cannot exceed 60 characters"],
    },

    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      enum: {
        values: [
          "Computer Science",
          "Information Technology",
          "Electronics & Communication",
          "Mechanical Engineering",
          "Civil Engineering",
          "Electrical Engineering",
          "Business Administration",
        ],
        message: "{VALUE} is not a supported department",
      },
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      enum: {
        values: ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "MBA"],
        message: "{VALUE} is not a supported course",
      },
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester cannot exceed 8"],
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[0-9+\-\s()]{7,20}$/,
        "Please provide a valid phone number (7-20 digits)",
      ],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Graduated"],
      default: "Active",
    },

    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index or single index for fast query searching
studentSchema.index({ rollNumber: 1, email: 1 });
studentSchema.index({ department: 1, status: 1 });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
