// controllers/announcementController.js
// Handles campus notices, bulletins, and announcements.

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");

// ── getAnnouncements ──────────────────────────────────────────────────────────
// GET /api/announcements
// Access: Protected (All authenticated users)
const getAnnouncements = asyncHandler(async (req, res) => {
  const query = { isActive: true };

  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.priority) {
    query.priority = req.query.priority;
  }
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    query.$or = [{ title: searchRegex }, { content: searchRegex }];
  }

  const announcements = await Announcement.find(query).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    count: announcements.length,
    data: announcements,
  });
});

// ── createAnnouncement ────────────────────────────────────────────────────────
// POST /api/announcements
// Access: Protected (Admin only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, category, priority, targetAudience } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Title and content are required");
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    content: content.trim(),
    category: category || "General",
    priority: priority || "Normal",
    targetAudience: targetAudience || "All",
    postedBy: req.user.name,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Announcement published successfully",
    data: announcement,
  });
});

// ── updateAnnouncement ────────────────────────────────────────────────────────
// PUT /api/announcements/:id
// Access: Protected (Admin only)
const updateAnnouncement = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid announcement ID format");
  }

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  const { title, content, category, priority, targetAudience, isActive } = req.body;

  if (title) announcement.title = title.trim();
  if (content) announcement.content = content.trim();
  if (category) announcement.category = category;
  if (priority) announcement.priority = priority;
  if (targetAudience) announcement.targetAudience = targetAudience;
  if (isActive !== undefined) announcement.isActive = isActive;

  const updatedAnnouncement = await announcement.save();

  res.json({
    success: true,
    message: "Announcement updated successfully",
    data: updatedAnnouncement,
  });
});

// ── deleteAnnouncement ────────────────────────────────────────────────────────
// DELETE /api/announcements/:id
// Access: Protected (Admin only)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid announcement ID format");
  }

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Announcement deleted successfully",
    data: { id: req.params.id },
  });
});

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
