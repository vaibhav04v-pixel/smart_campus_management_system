// models/Attendance.js
// Mongoose schema for Student Attendance Tracking with Compound Unique Index.

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
    },

    date: {
      type: Date,
      required: [true, "Attendance date is required"],
    },

    status: {
      type: String,
      required: [true, "Attendance status is required"],
      enum: {
        values: ["Present", "Absent", "Late"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "Present",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
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

// CRITICAL UNIQUE COMPOUND INDEX:
// Guarantees at MongoDB storage level that one student cannot have two attendance entries for the same course on the same date.
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ student: 1, status: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
