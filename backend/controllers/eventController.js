// controllers/eventController.js
// Handles campus events, updates, and student registrations.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Event = require("../models/Event");

// ── getEvents ─────────────────────────────────────────────────────────────────
// GET /api/events
// Access: Protected
const getEvents = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    query.$or = [{ title: searchRegex }, { description: searchRegex }, { venue: searchRegex }];
  }

  const events = await Event.find(query).sort({ date: 1 });

  // Add virtual or computed flag showing whether the current user is registered
  const formattedEvents = events.map((ev) => {
    const evObj = ev.toObject();
    const isRegistered = ev.registeredStudents.some(
      (r) => r.user.toString() === req.user._id.toString()
    );
    return {
      ...evObj,
      registeredCount: ev.registeredStudents.length,
      isRegistered,
    };
  });

  res.json({
    success: true,
    count: formattedEvents.length,
    data: formattedEvents,
  });
});

// ── createEvent ───────────────────────────────────────────────────────────────
// POST /api/events
// Access: Protected (Admin only)
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, venue, date, time, capacity } = req.body;

  if (!title || !description || !venue || !date || !time || !capacity) {
    res.status(400);
    throw new Error("Please provide all required event details");
  }

  const event = await Event.create({
    title: title.trim(),
    description: description.trim(),
    category: category || "Technical",
    venue: venue.trim(),
    date: new Date(date),
    time: time.trim(),
    capacity: Number(capacity),
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    data: event,
  });
});

// ── updateEvent ───────────────────────────────────────────────────────────────
// PUT /api/events/:id
// Access: Protected (Admin only)
const updateEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid event ID format");
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  const { title, description, category, venue, date, time, capacity, status } = req.body;

  if (title) event.title = title.trim();
  if (description) event.description = description.trim();
  if (category) event.category = category;
  if (venue) event.venue = venue.trim();
  if (date) event.date = new Date(date);
  if (time) event.time = time.trim();
  if (capacity) event.capacity = Number(capacity);
  if (status) event.status = status;

  const updatedEvent = await event.save();

  res.json({
    success: true,
    message: "Event updated successfully",
    data: updatedEvent,
  });
});

// ── deleteEvent ───────────────────────────────────────────────────────────────
// DELETE /api/events/:id
// Access: Protected (Admin only)
const deleteEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid event ID format");
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  await Event.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Event deleted successfully",
    data: { id: req.params.id },
  });
});

// ── registerForEvent ──────────────────────────────────────────────────────────
// POST /api/events/:id/register
// Access: Protected (Any authenticated student/user)
const registerForEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid event ID format");
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  // Check if already registered
  const alreadyRegistered = event.registeredStudents.some(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyRegistered) {
    res.status(409);
    throw new Error("You are already registered for this event");
  }

  // Check capacity
  if (event.registeredStudents.length >= event.capacity) {
    res.status(400);
    throw new Error("This event has reached full capacity");
  }

  event.registeredStudents.push({
    user: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });

  await event.save();

  res.json({
    success: true,
    message: "Successfully registered for event!",
    data: {
      eventId: event._id,
      registeredCount: event.registeredStudents.length,
      isRegistered: true,
    },
  });
});

// ── unregisterFromEvent ───────────────────────────────────────────────────────
// POST /api/events/:id/unregister
// Access: Protected
const unregisterFromEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid event ID format");
  }

  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  event.registeredStudents = event.registeredStudents.filter(
    (r) => r.user.toString() !== req.user._id.toString()
  );

  await event.save();

  res.json({
    success: true,
    message: "Successfully cancelled event registration",
    data: {
      eventId: event._id,
      registeredCount: event.registeredStudents.length,
      isRegistered: false,
    },
  });
});

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
};
