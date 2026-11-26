// src/pages/AnnouncementsPage.jsx
// Campus Notices and Announcements Board.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/dashboard.css";
import "../styles/auth.css";

const CATEGORIES = ["General", "Academic", "Exam", "Holiday", "Placement", "Urgent"];
const PRIORITIES = ["Normal", "High", "Critical"];

const AnnouncementsPage = () => {
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Normal");
  const [targetAudience, setTargetAudience] = useState("All");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/announcements", { params });
      if (res.data?.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Publish Announcement (Admin)
  const handlePublish = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !content.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post("/announcements", {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        targetAudience,
      });
      setSuccessMsg("Notice published to campus board!");
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      setCategory("General");
      setPriority("Normal");
      fetchAnnouncements();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to publish notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Announcement (Admin)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await API.delete(`/announcements/${id}`);
      setSuccessMsg("Notice deleted.");
      fetchAnnouncements();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete notice.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a1128", color: "#e2e8f0" }}>
      <Navbar />

      <main className="students-container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Campus Bulletins & Notices
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              Official university circulars, examination schedules, and urgent academic announcements
            </p>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <span>📢</span> Post Notice
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="auth-alert success" style={{ marginBottom: "1.5rem" }}>
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="auth-alert error" style={{ marginBottom: "1.5rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="toolbar-card">
          <div className="toolbar-top">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search notices by keyword or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setCategoryFilter("");
                setPriorityFilter("");
                setSearch("");
              }}
            >
              Reset
            </button>
          </div>

          <div className="toolbar-filters">
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notices Feed */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
            Loading announcements...
          </p>
        ) : announcements.length === 0 ? (
          <div className="table-card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No notices published matching your filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {announcements.map((note) => (
              <div
                key={note._id}
                style={{
                  background: "#1b263b",
                  border:
                    note.priority === "Critical"
                      ? "1px solid rgba(239, 68, 68, 0.45)"
                      : "1px solid rgba(0, 180, 216, 0.2)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`badge-priority ${note.priority}`}>{note.priority}</span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#00b4d8",
                        background: "rgba(0, 180, 216, 0.12)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      {note.category}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      Audience: {note.targetAudience}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      className="btn-icon-delete"
                      title="Delete Notice"
                      onClick={() => handleDelete(note._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                <h3 style={{ margin: "0 0 0.6rem 0", color: "#ffffff", fontSize: "1.25rem" }}>
                  {note.title}
                </h3>

                <p
                  style={{
                    margin: "0 0 1rem 0",
                    color: "#cbd5e1",
                    fontSize: "0.92rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {note.content}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    borderTop: "1px solid #415a77",
                    paddingTop: "0.75rem",
                  }}
                >
                  <span>✍️ Posted by: <strong style={{ color: "#e2e8f0" }}>{note.postedBy}</strong></span>
                  <span>🕒 {new Date(note.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Post Notice Modal (Admin) */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Publish Campus Bulletin</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  ✕
                </button>
              </div>

              {formError && (
                <div className="auth-alert error" style={{ marginBottom: "1.25rem" }}>
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handlePublish} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Notice Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. End Semester Examination Schedule Announcement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-select"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
                    <option value="All">All Campus Members</option>
                    <option value="Students">Students Only</option>
                    <option value="Staff">Faculty & Staff</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notice Details *</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    placeholder="Provide complete notice details, instructions, links, or dates..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Publishing..." : "Publish Bulletin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnouncementsPage;
