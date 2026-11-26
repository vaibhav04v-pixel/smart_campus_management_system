// src/pages/StudentsPage.jsx
// Complete Student Management Dashboard with CRUD operations, search, filters, and statistics.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/auth.css";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Business Administration",
];

const COURSES = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "MBA"];

const initialFormState = {
  rollNumber: "",
  fullName: "",
  email: "",
  department: "Computer Science",
  course: "B.Tech",
  semester: 1,
  phoneNumber: "",
  status: "Active",
};

const StudentsPage = () => {
  const { isAdmin } = useAuth();

  // Student list & pagination state
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Statistics state
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const res = await API.get("/students/stats");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch student statistics:", err);
    }
  };

  // Fetch paginated and filtered students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedDept) params.department = selectedDept;
      if (selectedCourse) params.course = selectedCourse;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedStatus) params.status = selectedStatus;

      const res = await API.get("/students", { params });
      if (res.data?.success) {
        setStudents(res.data.data);
        setTotalStudents(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load student records."
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedDept, selectedCourse, selectedSemester, selectedStatus]);

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [fetchStudents]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(initialFormState);
    setFormError("");
    setIsEditing(false);
    setCurrentStudentId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setFormData({
      rollNumber: student.rollNumber,
      fullName: student.fullName,
      email: student.email,
      department: student.department,
      course: student.course,
      semester: student.semester,
      phoneNumber: student.phoneNumber,
      status: student.status,
    });
    setFormError("");
    setIsEditing(true);
    setCurrentStudentId(student._id);
    setIsModalOpen(true);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    // Client-side validations
    if (
      !formData.rollNumber.trim() ||
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phoneNumber.trim()
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (formData.fullName.trim().length < 2) {
      setFormError("Full name must be at least 2 characters.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await API.put(`/students/${currentStudentId}`, formData);
        setSuccessMsg("Student record updated successfully!");
      } else {
        await API.post("/students", formData);
        setSuccessMsg("New student added successfully!");
      }
      setIsModalOpen(false);
      fetchStudents();
      fetchStats();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Operation failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await API.delete(`/students/${studentToDelete._id}`);
      setSuccessMsg(`Student ${studentToDelete.fullName} removed.`);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
      fetchStats();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to delete student record."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedDept("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedStatus("");
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a1128", color: "#e2e8f0" }}>
      <Navbar />

      <main className="students-container">
        {/* Page Header */}
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
              Student Management
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              Comprehensive NoSQL directory of campus enrollments and departments
            </p>
          </div>

          {isAdmin ? (
            <button className="btn-primary" onClick={handleOpenCreate}>
              <span>➕</span> Add New Student
            </button>
          ) : (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#06d6a0",
                background: "rgba(6, 214, 160, 0.1)",
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid rgba(6, 214, 160, 0.25)",
              }}
            >
              👁️ View Only Mode (Student Role)
            </div>
          )}
        </div>

        {/* Global Feedback Messages */}
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

        {/* Live Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{stats.totalStudents || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: "#06d6a0", background: "rgba(6, 214, 160, 0.15)" }}>
              🎓
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Enrollments</span>
              <span className="stat-value" style={{ color: "#06d6a0" }}>
                {stats.activeStudents || 0}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.15)" }}>
              ⏸️
            </div>
            <div className="stat-info">
              <span className="stat-label">Inactive / On Leave</span>
              <span className="stat-value" style={{ color: "#f87171" }}>
                {stats.inactiveStudents || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="toolbar-card">
          <div className="toolbar-top">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by Roll No, Name, or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <button className="btn-secondary" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>

          <div className="toolbar-filters">
            <select
              className="filter-select"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Courses</option>
              {COURSES.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Department & Course</th>
                  <th>Sem</th>
                  <th>Phone</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
                      Loading student records...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                      No student records match your query criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <span className="roll-badge">{student.rollNumber}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#ffffff" }}>
                        {student.fullName}
                      </td>
                      <td style={{ color: "#94a3b8" }}>{student.email}</td>
                      <td>
                        <div style={{ color: "#e2e8f0" }}>{student.department}</div>
                        <div style={{ fontSize: "0.78rem", color: "#00b4d8" }}>
                          {student.course}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>Sem {student.semester}</span>
                      </td>
                      <td style={{ color: "#94a3b8", fontFamily: "monospace" }}>
                        {student.phoneNumber}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            student.status === "Active"
                              ? "active"
                              : student.status === "Inactive"
                              ? "inactive"
                              : "graduated"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn-icon-edit"
                              title="Edit Student"
                              onClick={() => handleOpenEdit(student)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-icon-delete"
                              title="Delete Student"
                              onClick={() => handleOpenDelete(student)}
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

          {/* Pagination Controls */}
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {students.length} of {totalStudents} students (Page {page} of {totalPages})
            </div>

            <div className="pagination-controls">
              <button
                className="btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                ◀ Previous
              </button>
              <button
                className="btn-secondary"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>

        {/* Add / Edit Student Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {isEditing ? "Edit Student Record" : "Add New Student"}
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
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
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS2026001"
                      value={formData.rollNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Alex Mercer"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="alex.m@campus.edu"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1-555-0199"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                    >
                      {COURSES.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Semester (1-8) *</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      className="form-input"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </div>
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
                    {isSubmitting
                      ? "Saving Record..."
                      : isEditing
                      ? "Update Student"
                      : "Create Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
            <div
              className="modal-content"
              style={{ maxWidth: "440px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#ef4444" }}>
                  Confirm Deletion
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
                Are you sure you want to permanently delete the student record for{" "}
                <strong style={{ color: "#ffffff" }}>{studentToDelete?.fullName}</strong>{" "}
                (Roll No: <code style={{ color: "#00b4d8" }}>{studentToDelete?.rollNumber}</code>)?
              </p>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    background: "#ef4444",
                    color: "#ffffff",
                  }}
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentsPage;
