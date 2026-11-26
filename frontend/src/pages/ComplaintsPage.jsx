// src/pages/ComplaintsPage.jsx
// Complaints management with role-based submission, tracking, and admin resolution.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/dashboard.css";
import "../styles/auth.css";

const CATEGORIES = [
  "Infrastructure",
  "Academic",
  "Hostel",
  "Cafeteria",
  "Library",
  "Transportation",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Pending", "In Review", "Resolved", "Rejected"];

const ComplaintsPage = () => {
  const { user, isAdmin } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  // Submit Complaint Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [priority, setPriority] = useState("Medium");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Status Update Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState("In Review");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/complaints", { params });
      if (res.data?.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Handle complaint submission
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !description.trim()) {
      setFormError("Title and description are required.");
      return;
    }

    if (description.trim().length < 10) {
      setFormError("Description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post("/complaints", {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setSuccessMsg("Complaint submitted successfully!");
      setIsSubmitModalOpen(false);
      setTitle("");
      setDescription("");
      setCategory("Infrastructure");
      setPriority("Medium");
      fetchComplaints();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open status modal
  const handleOpenStatusModal = (comp) => {
    setSelectedComplaint(comp);
    setNewStatus(comp.status);
    setAdminNotes(comp.adminNotes || "");
    setIsStatusModalOpen(true);
  };

  // Submit status update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsUpdatingStatus(true);
    try {
      await API.put(`/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        adminNotes,
      });
      setSuccessMsg(`Complaint status updated to ${newStatus}.`);
      setIsStatusModalOpen(false);
      setSelectedComplaint(null);
      fetchComplaints();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update complaint status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete complaint
  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint record?")) return;
    try {
      await API.delete(`/complaints/${id}`);
      setSuccessMsg("Complaint deleted successfully.");
      fetchComplaints();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete complaint.");
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
              Campus Complaints & Grievance Portal
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              {isAdmin
                ? "Admin Grievance Manager: Review, assign priority, and resolve student complaints"
                : "Submit campus issues, track resolution progress, and view administrative responses"}
            </p>
          </div>

          <button className="btn-primary" onClick={() => setIsSubmitModalOpen(true)}>
            <span>📝</span> Lodge New Complaint
          </button>
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
                placeholder="Search by title, description, or student name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
                setCategoryFilter("");
                setSearch("");
              }}
            >
              Reset Filters
            </button>
          </div>

          <div className="toolbar-filters">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr} Priority
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Title & Category</th>
                  <th>Submitted By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                  <th>Admin Notes</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
                      Loading complaints...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                      No complaints found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map((comp) => (
                    <tr key={comp._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "0.95rem" }}>
                          {comp.title}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#00b4d8", marginTop: "0.15rem" }}>
                          🏷️ {comp.category}
                        </div>
                        <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                          {comp.description}
                        </p>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#ffffff" }}>{comp.studentName}</div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{comp.studentEmail}</div>
                      </td>
                      <td>
                        <span className={`badge-priority ${comp.priority}`}>{comp.priority}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            comp.status === "Resolved"
                              ? "active"
                              : comp.status === "Pending"
                              ? "inactive"
                              : "graduated"
                          }`}
                        >
                          {comp.status}
                        </span>
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                        {new Date(comp.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "200px" }}>
                        {comp.adminNotes || <span style={{ color: "#64748b" }}>—</span>}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn-icon-edit"
                              title="Update Status"
                              onClick={() => handleOpenStatusModal(comp)}
                            >
                              ⚙️ Status
                            </button>
                            <button
                              className="btn-icon-delete"
                              title="Delete"
                              onClick={() => handleDeleteComplaint(comp._id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Complaint Modal */}
        {isSubmitModalOpen && (
          <div className="modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Lodge a Campus Complaint</h2>
                <button className="modal-close" onClick={() => setIsSubmitModalOpen(false)}>
                  ✕
                </button>
              </div>

              {formError && (
                <div className="auth-alert error" style={{ marginBottom: "1.25rem" }}>
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitComplaint} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Complaint Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Broken projector in Lab 302"
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
                    <label className="form-label">Priority Level</label>
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
                  <label className="form-label">Detailed Description *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Please specify location, issue specifics, and impact..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsSubmitModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Complaint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Status Update Modal */}
        {isStatusModalOpen && (
          <div className="modal-overlay" onClick={() => setIsStatusModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Update Complaint Status</h3>
                <button className="modal-close" onClick={() => setIsStatusModalOpen(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Resolution Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Administrative Resolution Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Technician dispatched, parts replaced, resolved."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsStatusModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? "Saving..." : "Save Status"}
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

export default ComplaintsPage;
