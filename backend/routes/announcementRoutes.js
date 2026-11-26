// routes/announcementRoutes.js
// Routes for Campus Announcements & Notices.

const express = require("express");
const router = express.Router();

const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.route("/")
  .get(protect, getAnnouncements)
  .post(protect, adminOnly, createAnnouncement);

router.route("/:id")
  .put(protect, adminOnly, updateAnnouncement)
  .delete(protect, adminOnly, deleteAnnouncement);

module.exports = router;
