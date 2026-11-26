// routes/eventRoutes.js
// Routes for College Events and Student Registrations.

const express = require("express");
const router = express.Router();

const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getEvents)
  .post(protect, adminOnly, createEvent);

router.route("/:id")
  .put(protect, adminOnly, updateEvent)
  .delete(protect, adminOnly, deleteEvent);

router.route("/:id/register")
  .post(protect, registerForEvent);

router.route("/:id/unregister")
  .post(protect, unregisterFromEvent);

module.exports = router;
