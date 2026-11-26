// models/Announcement.js
// Mongoose schema for College Announcements & Notices in MongoDB Atlas.

const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    content: {
      type: String,
      required: [true, "Announcement content is required"],
      trim: true,
      minlength: [5, "Content must be at least 5 characters"],
    },

    category: {
      type: String,
      enum: ["General", "Academic", "Exam", "Holiday", "Placement", "Urgent"],
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Normal", "High", "Critical"],
      default: "Normal",
    },

    targetAudience: {
      type: String,
      enum: ["All", "Students", "Staff"],
      default: "All",
    },

    postedBy: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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

announcementSchema.index({ createdAt: -1, priority: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

module.exports = Announcement;
