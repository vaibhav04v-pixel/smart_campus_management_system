import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";
import "../styles/students.css";

const getDashboardData = async () => {
  const { data } = await API.get("/dashboard/student");
  if (!data?.success || !data?.data) {
    throw new Error(data?.message || "Student dashboard data is unavailable.");
  }
  return data.data;
};

const getDashboardErrorMessage = (requestError) =>
  requestError?.response?.data?.message ||
  requestError.message ||
  "Unable to load your dashboard.";

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await getDashboardData());
    } catch (requestError) {
      setError(getDashboardErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getDashboardData()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((requestError) => {
        if (active) setError(getDashboardErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const overview = dashboard?.overview;
  const metric = (value) => (loading ? "…" : value);

  return (
    <div style={{ minHeight: "100vh", background: "#0a1128", color: "#e2e8f0" }}>
      <Navbar />
      <main className="dashboard-container">
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
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#fff" }}>
              Student Dashboard
            </h1>
            <p style={{ margin: "0.35rem 0 0", color: "#94a3b8" }}>
              Welcome back, <strong style={{ color: "#00b4d8" }}>{user?.name}</strong>
              {dashboard?.student?.rollNumber
                ? ` · ${dashboard.student.rollNumber}`
                : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link to="/courses" className="btn-secondary">📚 Courses</Link>
            <Link to="/attendance" className="btn-secondary">📊 Attendance</Link>
            <Link to="/complaints" className="btn-secondary">📋 Complaints</Link>
            <Link to="/events" className="btn-primary">🎉 Events</Link>
          </div>
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: "1.5rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
            <button className="btn-secondary" onClick={loadDashboard}>Retry</button>
          </div>
        )}

        {!loading && dashboard && !dashboard.student && (
          <div className="auth-alert error" style={{ marginBottom: "1.5rem" }}>
            Your account does not yet have a student record linked. Ask an administrator
            to create your student record using this account&apos;s email address; course
            and attendance details will appear after it is linked.
          </div>
        )}

        <div className="metrics-row">
          <MetricCard icon="📚" title="Enrolled Courses" value={metric(overview?.enrolledCourseCount)} color="#06d6a0" />
          <MetricCard
            icon="📊"
            title="Attendance"
            value={loading ? "…" : overview?.attendancePercentage == null ? "No records" : `${overview.attendancePercentage}%`}
            color="#00b4d8"
          />
          <MetricCard icon="📋" title="My Complaints" value={metric(overview?.totalComplaints)} color="#c084fc" />
          <MetricCard icon="⏳" title="Pending Complaints" value={metric(overview?.pendingComplaints)} color="#fbbf24" />
          <MetricCard icon="🎪" title="Upcoming Events" value={metric(overview?.upcomingEventsCount)} color="#f87171" />
          <MetricCard icon="📢" title="Student Notices" value={metric(overview?.totalAnnouncements)} color="#48cae4" />
        </div>

        <div className="dashboard-grid-2">
          <section className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">📚 My Enrolled Courses</h2>
              <Link to="/courses" style={{ color: "#00b4d8" }}>Course catalog →</Link>
            </div>
            {loading ? (
              <p style={{ color: "#94a3b8" }}>Loading your courses…</p>
            ) : !dashboard?.enrolledCourses?.length ? (
              <p style={{ color: "#94a3b8" }}>No courses are linked to your student record yet.</p>
            ) : dashboard.enrolledCourses.map((course) => (
              <article className="feed-card" key={course._id}>
                <h3 className="feed-title">{course.courseCode} · {course.courseName}</h3>
                <div className="feed-meta">
                  <span>{course.instructor}</span>
                  <span>{course.credits} credits</span>
                  <span>Semester {course.semester}</span>
                </div>
              </article>
            ))}
            {!loading && overview?.attendanceRecords > 0 && (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Attendance from {overview.attendanceRecords} recorded class entries:
                {" "}{overview.presentAttendance} present, {overview.lateAttendance} late,
                {" "}{overview.absentAttendance} absent.
              </p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">🎪 Upcoming Campus Events</h2>
              <Link to="/events" style={{ color: "#00b4d8" }}>All events →</Link>
            </div>
            {loading ? (
              <p style={{ color: "#94a3b8" }}>Loading upcoming events…</p>
            ) : !dashboard?.upcomingEvents?.length ? (
              <p style={{ color: "#94a3b8" }}>There are no upcoming events scheduled.</p>
            ) : dashboard.upcomingEvents.map((event) => (
              <article className="feed-card" key={event._id}>
                <h3 className="feed-title">{event.title}</h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.88rem" }}>{event.description}</p>
                <div className="feed-meta">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.time}</span>
                  <span>{event.venue}</span>
                </div>
              </article>
            ))}
          </section>
        </div>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">📢 Campus Announcements</h2>
            <Link to="/announcements" style={{ color: "#00b4d8" }}>All notices →</Link>
          </div>
          {loading ? (
            <p style={{ color: "#94a3b8" }}>Loading campus announcements…</p>
          ) : !dashboard?.announcements?.length ? (
            <p style={{ color: "#94a3b8" }}>No active announcements for students.</p>
          ) : dashboard.announcements.map((announcement) => (
            <article className="feed-card" key={announcement._id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <h3 className="feed-title">{announcement.title}</h3>
                <span className={`badge-priority ${announcement.priority}`}>
                  {announcement.priority}
                </span>
              </div>
              <p style={{ color: "#cbd5e1", fontSize: "0.88rem" }}>{announcement.content}</p>
              <div className="feed-meta">
                <span>{announcement.category}</span>
                <span>{announcement.postedBy}</span>
                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

const MetricCard = ({ icon, title, value, color }) => (
  <div className="metric-card">
    <div className="metric-icon-box" style={{ background: `${color}26`, color }}>
      {icon}
    </div>
    <div className="metric-info">
      <span className="metric-title">{title}</span>
      <span className="metric-number" style={{ color }}>{value ?? 0}</span>
    </div>
  </div>
);

export default StudentDashboardPage;
