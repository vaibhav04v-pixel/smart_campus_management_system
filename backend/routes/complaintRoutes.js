// routes/complaintRoutes.js
// Routes for Complaints management operations.

const express = require("express");
const router = express.Router();

const {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint,
} = require("../controllers/complaintController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getComplaints)
  .post(protect, createComplaint);

router.route("/:id/status")
  .put(protect, adminOnly, updateComplaintStatus);

router.route("/:id")
  .delete(protect, adminOnly, deleteComplaint);

module.exports = router;
