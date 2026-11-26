// controllers/complaintController.js
// Handles student complaints submission, status tracking, and admin resolution.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");

// ── getComplaints ─────────────────────────────────────────────────────────────
// GET /api/complaints
// Access: Protected
// - Admin sees all complaints (with filters: status, priority, category, search)
// - Student sees only their own complaints
const getComplaints = asyncHandler(async (req, res) => {
  const query = {};

  // Role separation: students only see their own submissions
  if (req.user.role !== "admin") {
    query.submittedBy = req.user._id;
  }

  // Filters
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.priority) {
    query.priority = req.query.priority;
  }
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { studentName: searchRegex },
    ];
  }

  const complaints = await Complaint.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: complaints.length,
    data: complaints,
  });
});

// ── createComplaint ───────────────────────────────────────────────────────────
// POST /api/complaints
// Access: Protected (Students & Admins)
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  const complaint = await Complaint.create({
    title: title.trim(),
    description: description.trim(),
    category: category || "Infrastructure",
    priority: priority || "Medium",
    submittedBy: req.user._id,
    studentName: req.user.name,
    studentEmail: req.user.email,
  });

  res.status(201).json({
    success: true,
    message: "Complaint submitted successfully",
    data: complaint,
  });
});

// ── updateComplaintStatus ─────────────────────────────────────────────────────
// PUT /api/complaints/:id/status
// Access: Protected (Admin only)
const updateComplaintStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid complaint ID format");
  }

  const { status, adminNotes } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status value is required");
  }
  if (!["Pending", "In Review", "In Progress", "Resolved", "Rejected"].includes(status)) {
    res.status(400);
    throw new Error("Unsupported complaint status");
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  complaint.status = status;
  if (adminNotes !== undefined) {
    complaint.adminNotes = typeof adminNotes === "string" ? adminNotes.trim() : "";
  }
  if (status === "Resolved") {
    complaint.resolvedAt = new Date();
  } else {
    complaint.resolvedAt = null;
  }

  const updatedComplaint = await complaint.save();

  res.json({
    success: true,
    message: `Complaint marked as ${status}`,
    data: updatedComplaint,
  });
});

// ── deleteComplaint ───────────────────────────────────────────────────────────
// DELETE /api/complaints/:id
// Access: Protected (Admin only)
const deleteComplaint = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid complaint ID format");
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error("Complaint not found");
  }

  await Complaint.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Complaint deleted successfully",
    data: { id: req.params.id },
  });
});

module.exports = {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint,
};
