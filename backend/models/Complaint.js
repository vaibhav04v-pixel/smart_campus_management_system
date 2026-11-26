// models/Complaint.js
// Mongoose schema for Student Complaints in MongoDB Atlas.

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Infrastructure",
          "Academic",
          "Hostel",
          "Cafeteria",
          "Library",
          "Transportation",
          "Other",
        ],
        message: "{VALUE} is not a valid category",
      },
      default: "Infrastructure",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "In Review", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    studentEmail: {
      type: String,
      required: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
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

complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ submittedBy: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
