// models/Course.js
// Mongoose schema for Academic Courses and Student Enrollments in MongoDB Atlas.

const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "Course code must be at least 2 characters"],
      maxlength: [15, "Course code cannot exceed 15 characters"],
    },

    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      minlength: [3, "Course name must be at least 3 characters"],
      maxlength: [100, "Course name cannot exceed 100 characters"],
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
        message: "{VALUE} is not a valid department",
      },
    },

    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [6, "Credits cannot exceed 6"],
    },

    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
      trim: true,
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be between 1 and 8"],
      max: [8, "Semester must be between 1 and 8"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ courseCode: 1, department: 1 });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
