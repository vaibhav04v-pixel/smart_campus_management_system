// src/pages/AttendancePage.jsx
// Attendance Tracking, Daily Roll Marking, and Aggregated Student Reports.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/dashboard.css";
import "../styles/auth.css";

const AttendancePage = () => {
  const { user, isAdmin } = useAuth();

  // Active Tab: "mark" (admin only) or "reports" (all users)
  const [activeTab, setActiveTab] = useState(isAdmin ? "mark" : "reports");

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Mark Attendance State
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [attendanceSheet, setAttendanceSheet] = useState({}); // { [studentId]: { status, remarks } }
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Reports State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportCourseFilter, setReportCourseFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch Courses list
  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses");
      if (res.data?.success) {
        setCourses(res.data.data);
        if (res.data.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch course students and existing attendance for selected date
  const loadAttendanceSheet = useCallback(async () => {
    if (!selectedCourseId || !selectedDate) return;
    setLoadingSheet(true);
    setError("");
    try {
      // 1. Get Course details with enrolled students
      const courseRes = await API.get(`/courses/${selectedCourseId}`);
      const course = courseRes.data.data;
      const students = course.enrolledStudents || [];
      setEnrolledStudents(students);

      // 2. Get existing attendance records for this date
      const attRes = await API.get(
        `/attendance/course/${selectedCourseId}?date=${selectedDate}`
      );
      const existingRecords = attRes.data.data || [];

      // Map to sheet
      const sheet = {};
      students.forEach((st) => {
        const found = existingRecords.find(
          (r) => (r.student?._id || r.student) === st._id
        );
        sheet[st._id] = {
          status: found ? found.status : "Present",
          remarks: found ? found.remarks : "",
        };
      });
      setAttendanceSheet(sheet);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load attendance sheet.");
    } finally {
      setLoadingSheet(false);
    }
  }, [selectedCourseId, selectedDate]);

  useEffect(() => {
    if (activeTab === "mark" && isAdmin) {
      loadAttendanceSheet();
    }
  }, [loadAttendanceSheet, activeTab, isAdmin]);

  // Fetch Attendance Reports
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setError("");
    try {
      const params = {};
      if (reportCourseFilter) params.courseId = reportCourseFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await API.get("/attendance/reports", { params });
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load attendance reports.");
    } finally {
      setLoadingReports(false);
    }
  }, [reportCourseFilter, startDate, endDate]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [fetchReports, activeTab]);

  // Mark all enrolled as Present
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceSheet };
    Object.keys(updated).forEach((stId) => {
      updated[stId].status = "Present";
    });
    setAttendanceSheet(updated);
  };

  // Change single student status
  const handleStatusChange = (studentId, status) => {
    setAttendanceSheet((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setSavingAttendance(true);
    setError("");
    try {
      const records = Object.entries(attendanceSheet).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks,
      }));

      const res = await API.post("/attendance/mark", {
        courseId: selectedCourseId,
        date: selectedDate,
        records,
      });

      setSuccessMsg(res.data.message || "Attendance saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save attendance.");
    } finally {
      setSavingAttendance(false);
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
              Attendance & Performance Reports
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              Daily roll call marking, course-wise summaries, and percentage aggregations
            </p>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {isAdmin && (
              <button
                className={activeTab === "mark" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("mark")}
              >
                ✏️ Mark Daily Attendance
              </button>
            )}
            <button
              className={activeTab === "reports" ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveTab("reports")}
            >
              📊 Attendance Reports
            </button>
          </div>
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

        {/* TAB 1: MARK ATTENDANCE (ADMIN ONLY) */}
        {activeTab === "mark" && isAdmin && (
          <div>
            <div className="toolbar-card">
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>
                    Select Course:
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: "100%" }}
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} — {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: "180px" }}>
                  <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>
                    Attendance Date:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div style={{ alignSelf: "flex-end", display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="btn-secondary" onClick={handleMarkAllPresent}>
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={savingAttendance || enrolledStudents.length === 0}
                    onClick={handleSaveAttendance}
                  >
                    {savingAttendance ? "Saving..." : "💾 Save Attendance"}
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Sheet Table */}
            <div className="table-card">
              <div className="table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Status (Present / Absent / Late)</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSheet ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
                          Loading attendance roster...
                        </td>
                      </tr>
                    ) : enrolledStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                          No students enrolled in this course yet. Go to Courses ➔ Manage Enrollments to assign students.
                        </td>
                      </tr>
                    ) : (
                      enrolledStudents.map((st) => {
                        const currentStatus = attendanceSheet[st._id]?.status || "Present";

                        return (
                          <tr key={st._id}>
                            <td>
                              <span className="roll-badge">{st.rollNumber}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: "#ffffff" }}>{st.fullName}</td>
                            <td>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st._id, "Present")}
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "6px",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    background:
                                      currentStatus === "Present"
                                        ? "rgba(6, 214, 160, 0.25)"
                                        : "transparent",
                                    border: `1px solid ${
                                      currentStatus === "Present" ? "#06d6a0" : "#415a77"
                                    }`,
                                    color: currentStatus === "Present" ? "#06d6a0" : "#94a3b8",
                                  }}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st._id, "Late")}
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "6px",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    background:
                                      currentStatus === "Late"
                                        ? "rgba(245, 158, 11, 0.25)"
                                        : "transparent",
                                    border: `1px solid ${
                                      currentStatus === "Late" ? "#fbbf24" : "#415a77"
                                    }`,
                                    color: currentStatus === "Late" ? "#fbbf24" : "#94a3b8",
                                  }}
                                >
                                  Late
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(st._id, "Absent")}
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "6px",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    background:
                                      currentStatus === "Absent"
                                        ? "rgba(239, 68, 68, 0.25)"
                                        : "transparent",
                                    border: `1px solid ${
                                      currentStatus === "Absent" ? "#f87171" : "#415a77"
                                    }`,
                                    color: currentStatus === "Absent" ? "#f87171" : "#94a3b8",
                                  }}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                                placeholder="Optional note..."
                                value={attendanceSheet[st._id]?.remarks || ""}
                                onChange={(e) =>
                                  setAttendanceSheet((prev) => ({
                                    ...prev,
                                    [st._id]: { ...prev[st._id], remarks: e.target.value },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE REPORTS & PERCENTAGE ANALYTICS */}
        {activeTab === "reports" && (
          <div>
            {/* Filter Toolbar */}
            <div className="toolbar-card">
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>
                    Filter Course:
                  </label>
                  <select
                    className="filter-select"
                    style={{ width: "100%" }}
                    value={reportCourseFilter}
                    onChange={(e) => setReportCourseFilter(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} — {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: "160px" }}>
                  <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>
                    From Date:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: "160px" }}>
                  <label className="form-label" style={{ marginBottom: "0.35rem", display: "block" }}>
                    To Date:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div style={{ alignSelf: "flex-end" }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setReportCourseFilter("");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="table-card">
              <div className="table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Classes Held</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingReports ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
                          Aggregating attendance reports...
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                          No attendance records found for this criteria.
                        </td>
                      </tr>
                    ) : (
                      reports.map((r, i) => {
                        const pct = r.attendancePercentage;
                        const isGood = pct >= 75;
                        const isAvg = pct >= 60 && pct < 75;
                        const color = isGood ? "#06d6a0" : isAvg ? "#fbbf24" : "#f87171";

                        return (
                          <tr key={`${r.studentId}-${r.courseId}-${i}`}>
                            <td>
                              <span className="roll-badge">{r.rollNumber}</span>
                            </td>
                            <td style={{ fontWeight: 600, color: "#ffffff" }}>{r.studentName}</td>
                            <td>
                              <div style={{ color: "#00b4d8", fontWeight: 600 }}>{r.courseCode}</div>
                              <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{r.courseName}</div>
                            </td>
                            <td>{r.totalClasses}</td>
                            <td style={{ color: "#06d6a0", fontWeight: 700 }}>{r.presentCount}</td>
                            <td style={{ color: "#fbbf24", fontWeight: 700 }}>{r.lateCount}</td>
                            <td style={{ color: "#f87171", fontWeight: 700 }}>{r.absentCount}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <div
                                  style={{
                                    flex: 1,
                                    height: "6px",
                                    background: "#0d1b2a",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                    minWidth: "60px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      background: color,
                                    }}
                                  />
                                </div>
                                <span style={{ color, fontWeight: 800, fontSize: "0.9rem" }}>
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AttendancePage;
