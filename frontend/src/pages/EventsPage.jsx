// src/pages/EventsPage.jsx
// Campus events browsing, student registration, and admin management.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/dashboard.css";
import "../styles/auth.css";

const EVENT_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Academic",
  "Other",
];

const initialEventState = {
  title: "",
  description: "",
  category: "Technical",
  venue: "",
  date: "",
  time: "",
  capacity: 50,
};

const EventsPage = () => {
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formData, setFormData] = useState(initialEventState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action loading states
  const [registeringId, setRegisteringId] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/events", { params });
      if (res.data?.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(initialEventState);
    setFormError("");
    setIsEditing(false);
    setCurrentEventId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (ev) => {
    setFormData({
      title: ev.title,
      description: ev.description,
      category: ev.category,
      venue: ev.venue,
      date: ev.date ? new Date(ev.date).toISOString().split("T")[0] : "",
      time: ev.time,
      capacity: ev.capacity,
    });
    setFormError("");
    setIsEditing(true);
    setCurrentEventId(ev._id);
    setIsModalOpen(true);
  };

  // Submit Event Form (Admin)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.venue.trim() ||
      !formData.date ||
      !formData.time.trim() ||
      !formData.capacity
    ) {
      setFormError("Please fill in all required event details.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await API.put(`/events/${currentEventId}`, formData);
        setSuccessMsg("Event updated successfully!");
      } else {
        await API.post("/events", formData);
        setSuccessMsg("New event announced successfully!");
      }
      setIsModalOpen(false);
      fetchEvents();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Event (Admin)
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and delete this event?")) return;
    try {
      await API.delete(`/events/${id}`);
      setSuccessMsg("Event removed.");
      fetchEvents();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete event.");
    }
  };

  // Register / Unregister
  const handleToggleRegistration = async (ev) => {
    setRegisteringId(ev._id);
    try {
      if (ev.isRegistered) {
        await API.post(`/events/${ev._id}/unregister`);
        setSuccessMsg(`Unregistered from '${ev.title}'.`);
      } else {
        await API.post(`/events/${ev._id}/register`);
        setSuccessMsg(`Registered successfully for '${ev.title}'!`);
      }
      fetchEvents();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration action failed.");
    } finally {
      setRegisteringId(null);
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
              Campus Events & Activities
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              Discover seminars, hackathons, sports, and technical workshops across campus
            </p>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={handleOpenCreate}>
              <span>➕</span> Schedule New Event
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
                placeholder="Search events by title, venue, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setCategoryFilter("");
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
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
            Loading campus events...
          </p>
        ) : events.length === 0 ? (
          <div className="table-card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No scheduled events match your search query.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {events.map((ev) => {
              const seatsLeft = ev.capacity - (ev.registeredCount || 0);
              const isFull = seatsLeft <= 0;

              return (
                <div
                  key={ev._id}
                  style={{
                    background: "#1b263b",
                    border: "1px solid rgba(0, 180, 216, 0.25)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span className="badge-priority Medium">{ev.category}</span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: isFull ? "#f87171" : "#06d6a0",
                        }}
                      >
                        {isFull ? "⚠️ Full Capacity" : `🎟️ ${seatsLeft} seats left`}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#ffffff", fontSize: "1.2rem" }}>
                      {ev.title}
                    </h3>

                    <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5 }}>
                      {ev.description}
                    </p>

                    <div
                      style={{
                        background: "#0d1b2a",
                        padding: "0.85rem",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        color: "#cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <div>📅 <strong>Date:</strong> {new Date(ev.date).toLocaleDateString()}</div>
                      <div>⏰ <strong>Time:</strong> {ev.time}</div>
                      <div>📍 <strong>Venue:</strong> {ev.venue}</div>
                      <div>👥 <strong>Enrolled:</strong> {ev.registeredCount || 0} / {ev.capacity}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      className="btn-primary"
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        background: ev.isRegistered ? "rgba(239, 68, 68, 0.2)" : "#00b4d8",
                        color: ev.isRegistered ? "#f87171" : "#0d1b2a",
                        border: ev.isRegistered ? "1px solid rgba(239, 68, 68, 0.4)" : "none",
                      }}
                      disabled={registeringId === ev._id || (!ev.isRegistered && isFull)}
                      onClick={() => handleToggleRegistration(ev)}
                    >
                      {registeringId === ev._id
                        ? "Processing..."
                        : ev.isRegistered
                        ? "Cancel Registration"
                        : isFull
                        ? "Event Full"
                        : "Register for Event"}
                    </button>

                    {isAdmin && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn-icon-edit"
                          title="Edit Event"
                          onClick={() => handleOpenEdit(ev)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-delete"
                          title="Delete Event"
                          onClick={() => handleDeleteEvent(ev._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal (Admin) */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {isEditing ? "Edit Campus Event" : "Create New Campus Event"}
                </h2>
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

              <form onSubmit={handleSubmitForm} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Annual Hackathon 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {EVENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Seat Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 10:00 AM - 4:00 PM"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Hall *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Main Auditorium, Block B"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Event objectives, schedule, guidelines, and prerequisites..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Publish Event"}
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

export default EventsPage;
