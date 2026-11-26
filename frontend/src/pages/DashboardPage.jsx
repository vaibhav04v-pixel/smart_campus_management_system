// src/pages/DashboardPage.jsx
// Main Admin & Student Campus Dashboard with live metrics from MongoDB Atlas Aggregations.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";
import "../styles/students.css";
import StudentDashboardPage from "./StudentDashboardPage";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role testing state for professor demonstrations
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;

    const fetchStats = async () => {
      try {
        const res = await API.get("/dashboard/stats");
        if (res.data?.success) {
          setStats(res.data.data);
        } else {
          setError(res.data?.message || "Dashboard statistics were unavailable.");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load dashboard statistics from MongoDB."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.role]);

  const handleTestAuth = async (endpoint, label) => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await API.get(endpoint);
      setTestResult({
        type: "success",
        status: res.status,
        endpoint: label,
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        status: err?.response?.status || 500,
        endpoint: label,
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  const overview = stats?.overview || {};
  const charts = stats?.charts || {};
  const feeds = stats?.feeds || {};

  if (user?.role === "student") {
    return <StudentDashboardPage />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a1128", color: "#e2e8f0" }}>
      <Navbar />

      <main className="dashboard-container">
        {/* Welcome Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Campus Overview
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.95rem" }}>
              Welcome back, <strong style={{ color: "#00b4d8" }}>{user?.name}</strong> (
              <span style={{ textTransform: "capitalize" }}>{user?.role}</span> account)
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link to="/students" className="btn-secondary">
              👥 Students
            </Link>
            <Link to="/courses" className="btn-secondary">
              📚 Courses
            </Link>
            <Link to="/attendance" className="btn-secondary">
              📊 Attendance
            </Link>
            <Link to="/complaints" className="btn-secondary">
              📋 Complaints
            </Link>
            <Link to="/events" className="btn-secondary">
              🎉 Events
            </Link>
            <Link to="/announcements" className="btn-primary">
              📢 Notices
            </Link>
            <Link to="/admin" className="btn-secondary">
              🛡️ Admin Portal
            </Link>
          </div>
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: "1.5rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Live Counters from MongoDB */}
        <div className="metrics-row">
          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(0, 180, 216, 0.15)", color: "#00b4d8" }}
            >
              👥
            </div>
            <div className="metric-info">
              <span className="metric-title">Total Enrolled</span>
              <span className="metric-number">
                {loading ? "..." : overview.totalStudents || 0}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(6, 214, 160, 0.15)", color: "#06d6a0" }}
            >
              📚
            </div>
            <div className="metric-info">
              <span className="metric-title">Active Courses</span>
              <span className="metric-number" style={{ color: "#06d6a0" }}>
                {loading ? "..." : overview.totalCourses || 0}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(0, 180, 216, 0.15)", color: "#00b4d8" }}
            >
              📈
            </div>
            <div className="metric-info">
              <span className="metric-title">Campus Attendance</span>
              <span className="metric-number" style={{ color: "#00b4d8" }}>
                {loading
                  ? "..."
                  : overview.overallAttendanceRate == null
                  ? "—"
                  : `${overview.overallAttendanceRate}%`}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
            >
              ⏳
            </div>
            <div className="metric-info">
              <span className="metric-title">Pending Complaints</span>
              <span className="metric-number" style={{ color: "#fbbf24" }}>
                {loading ? "..." : overview.pendingComplaints || 0}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}
            >
              🎪
            </div>
            <div className="metric-info">
              <span className="metric-title">Upcoming Events</span>
              <span className="metric-number" style={{ color: "#c084fc" }}>
                {loading ? "..." : overview.upcomingEventsCount || 0}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div
              className="metric-icon-box"
              style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}
            >
              📢
            </div>
            <div className="metric-info">
              <span className="metric-title">Active Notices</span>
              <span className="metric-number" style={{ color: "#f87171" }}>
                {loading ? "..." : overview.totalAnnouncements || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics: Department Breakdown & Status Metrics */}
        <div className="dashboard-grid-2">
          {/* Department Breakdown via MongoDB Aggregation */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>🏢</span> Department Distribution
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#00b4d8" }}>
                MongoDB $group
              </span>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8" }}>Calculating distribution...</p>
            ) : !charts.departmentBreakdown || charts.departmentBreakdown.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No student department data recorded yet.</p>
            ) : (
              charts.departmentBreakdown.map((dept) => {
                const total = overview.totalStudents || 1;
                const percent = Math.round((dept.count / total) * 100);
                return (
                  <div key={dept._id} className="dept-bar-item">
                    <div className="dept-bar-label">
                      <span>{dept._id}</span>
                      <span style={{ fontWeight: 700 }}>
                        {dept.count} ({percent}%)
                      </span>
                    </div>
                    <div className="dept-bar-track">
                      <div className="dept-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Complaints Status Breakdown */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>📋</span> Complaints by Status
              </h3>
              <Link to="/complaints" style={{ fontSize: "0.82rem", color: "#00b4d8" }}>
                Manage All ➔
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div
                style={{
                  background: "#0d1b2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #415a77",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#fbbf24" }}>Pending Action</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
                  {charts.complaintStatusBreakdown?.Pending || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#0d1b2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #415a77",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#00b4d8" }}>In Review</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
                  {charts.complaintStatusBreakdown?.["In Review"] || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#0d1b2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #415a77",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#06d6a0" }}>Resolved</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
                  {charts.complaintStatusBreakdown?.Resolved || 0}
                </div>
              </div>

              <div
                style={{
                  background: "#0d1b2a",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #415a77",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#f87171" }}>Rejected</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
                  {charts.complaintStatusBreakdown?.Rejected || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feeds Grid: Upcoming Events & Recent Notices */}
        <div className="dashboard-grid-2">
          {/* Upcoming Events Feed */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>🎪</span> Next Campus Events
              </h3>
              <Link to="/events" style={{ fontSize: "0.82rem", color: "#00b4d8" }}>
                View Events Calendar ➔
              </Link>
            </div>

            {!feeds.recentEvents || feeds.recentEvents.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No upcoming events scheduled right now.</p>
            ) : (
              feeds.recentEvents.map((ev) => (
                <div key={ev._id} className="feed-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 className="feed-title">{ev.title}</h4>
                    <span className="badge-priority Medium">{ev.category}</span>
                  </div>
                  <div className="feed-meta">
                    <span>📅 {new Date(ev.date).toLocaleDateString()}</span>
                    <span>⏰ {ev.time}</span>
                    <span>📍 {ev.venue}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Latest Campus Notices Feed */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>📢</span> Latest Notices
              </h3>
              <Link to="/announcements" style={{ fontSize: "0.82rem", color: "#00b4d8" }}>
                All Notices ➔
              </Link>
            </div>

            {!feeds.recentAnnouncements || feeds.recentAnnouncements.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No active notices at this moment.</p>
            ) : (
              feeds.recentAnnouncements.map((note) => (
                <div key={note._id} className="feed-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 className="feed-title">{note.title}</h4>
                    <span className={`badge-priority ${note.priority}`}>{note.priority}</span>
                  </div>
                  <p style={{ margin: "0.25rem 0 0.5rem 0", color: "#cbd5e1", fontSize: "0.85rem" }}>
                    {note.content.length > 90 ? `${note.content.slice(0, 90)}...` : note.content}
                  </p>
                  <div className="feed-meta">
                    <span>👤 {note.postedBy}</span>
                    <span>🕒 {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Role-Based Authorization Verification (Demo Component) */}
        <div
          className="dashboard-panel"
          style={{
            background: "linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)",
            border: "1px solid rgba(0, 180, 216, 0.3)",
          }}
        >
          <div className="panel-header">
            <h3 className="panel-title">
              <span>🛡️</span> Role-Based Authorization Verifier
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#00b4d8" }}>
              Active Session: {user?.role?.toUpperCase()}
            </span>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0 0 1.25rem 0" }}>
            Click below to test live JWT token validation and the Express <code>adminOnly</code> middleware:
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <button
              className="btn-secondary"
              onClick={() => handleTestAuth("/auth/me", "GET /api/auth/me")}
              disabled={loadingTest}
            >
              Verify User Profile (/api/auth/me)
            </button>
            <button
              className="btn-primary"
              onClick={() => handleTestAuth("/auth/admin-check", "GET /api/auth/admin-check")}
              disabled={loadingTest}
            >
              Verify Admin Route Guard (/api/auth/admin-check)
            </button>
          </div>

          {testResult && (
            <div
              style={{
                background: "#0d1b2a",
                border: `1px solid ${testResult.type === "success" ? "#06d6a0" : "#ef4444"}`,
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    color: testResult.type === "success" ? "#06d6a0" : "#ef4444",
                    fontWeight: 700,
                  }}
                >
                  {testResult.type === "success" ? "✅ HTTP 200 OK" : `⚠️ HTTP ${testResult.status}`}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{testResult.endpoint}</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#cbd5e1",
                  background: "rgba(0,0,0,0.4)",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(testResult.data || { error: testResult.message }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
