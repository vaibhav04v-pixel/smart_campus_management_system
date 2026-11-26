// models/Event.js
// Mongoose schema for College Events and Student Registrations in MongoDB Atlas.

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },

    category: {
      type: String,
      required: [true, "Event category is required"],
      enum: {
        values: [
          "Technical",
          "Cultural",
          "Sports",
          "Workshop",
          "Seminar",
          "Academic",
          "Other",
        ],
        message: "{VALUE} is not a valid event category",
      },
      default: "Technical",
    },

    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
    },

    time: {
      type: String,
      required: [true, "Event time is required"],
      trim: true,
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },

    registeredStudents: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: { type: String, required: true },
        email: { type: String, required: true },
        registeredAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
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

eventSchema.index({ date: 1, status: 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
