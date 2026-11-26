// src/pages/CoursesPage.jsx
// Course Catalog, Curriculum Management, and Student Assignments.

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/students.css";
import "../styles/dashboard.css";
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

const initialCourseForm = {
  courseCode: "",
  courseName: "",
  department: "Computer Science",
  credits: 3,
  instructor: "",
  semester: 1,
  description: "",
};

const CoursesPage = () => {
  const { isAdmin } = useAuth();

  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [deptFilter, setDeptFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [search, setSearch] = useState("");

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [formData, setFormData] = useState(initialCourseForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enrollment Modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      if (semFilter) params.semester = semFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/courses", { params });
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [deptFilter, semFilter, search]);

  // Fetch all students for enrollment dropdown
  const fetchStudents = async () => {
    try {
      const res = await API.get("/students?limit=200");
      if (res.data?.success) {
        setAllStudents(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load students list:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    if (isAdmin) {
      fetchStudents();
    }
  }, [fetchCourses, isAdmin]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(initialCourseForm);
    setFormError("");
    setIsEditing(false);
    setCurrentCourseId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setFormData({
      courseCode: c.courseCode,
      courseName: c.courseName,
      department: c.department,
      credits: c.credits,
      instructor: c.instructor,
      semester: c.semester,
      description: c.description || "",
    });
    setFormError("");
    setIsEditing(true);
    setCurrentCourseId(c._id);
    setIsModalOpen(true);
  };

  // Submit Course Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.courseCode.trim() ||
      !formData.courseName.trim() ||
      !formData.instructor.trim() ||
      !formData.credits ||
      !formData.semester
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await API.put(`/courses/${currentCourseId}`, formData);
        setSuccessMsg("Course updated successfully!");
      } else {
        await API.post("/courses", formData);
        setSuccessMsg("New course registered successfully!");
      }
      setIsModalOpen(false);
      fetchCourses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}? Associated attendance will also be cleared.`)) return;
    try {
      await API.delete(`/courses/${id}`);
      setSuccessMsg(`Course ${code} deleted.`);
      fetchCourses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete course.");
    }
  };

  // Open Enrollment Manager
  const handleOpenEnrollment = (course) => {
    setSelectedCourse(course);
    setSelectedStudentToEnroll("");
    setEnrollModalOpen(true);
  };

  // Assign Student to Course
  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToEnroll) return;
    setIsEnrolling(true);
    try {
      const res = await API.post(`/courses/${selectedCourse._id}/enroll`, {
        studentIds: [selectedStudentToEnroll],
      });
      setSuccessMsg("Student enrolled into course!");
      setSelectedCourse(res.data.data);
      fetchCourses();
      setSelectedStudentToEnroll("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to enroll student.");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Remove Student from Course
  const handleRemoveStudent = async (studentId) => {
    try {
      const res = await API.delete(`/courses/${selectedCourse._id}/enroll/${studentId}`);
      setSelectedCourse(res.data.data);
      setSuccessMsg("Student removed from course enrollment.");
      fetchCourses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove student.");
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
              Course Management & Curriculum
            </h1>
            <p style={{ margin: "0.25rem 0 0 0", color: "#94a3b8", fontSize: "0.92rem" }}>
              Browse campus courses, assign student enrollments, and track course credits
            </p>
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={handleOpenCreate}>
              <span>➕</span> Add New Course
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
                placeholder="Search by course code, name, or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setDeptFilter("");
                setSemFilter("");
                setSearch("");
              }}
            >
              Reset
            </button>
          </div>

          <div className="toolbar-filters">
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#00b4d8" }}>
            Loading course catalog...
          </p>
        ) : courses.length === 0 ? (
          <div className="table-card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No courses found matching your criteria.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {courses.map((c) => (
              <div
                key={c._id}
                style={{
                  background: "#1b263b",
                  border: "1px solid rgba(0, 180, 216, 0.25)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <span className="roll-badge">{c.courseCode}</span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#06d6a0",
                        background: "rgba(6, 214, 160, 0.15)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "6px",
                        fontWeight: 700,
                      }}
                    >
                      {c.credits} Credits
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 0.35rem 0", color: "#ffffff", fontSize: "1.2rem" }}>
                    {c.courseName}
                  </h3>

                  <div style={{ fontSize: "0.85rem", color: "#00b4d8", marginBottom: "0.75rem" }}>
                    🏢 {c.department} • Sem {c.semester}
                  </div>

                  <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5 }}>
                    {c.description || "No description provided."}
                  </p>

                  <div
                    style={{
                      background: "#0d1b2a",
                      padding: "0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      color: "#cbd5e1",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div>👨‍🏫 <strong>Instructor:</strong> {c.instructor}</div>
                    <div>👥 <strong>Enrolled Students:</strong> {c.enrolledStudents?.length || 0}</div>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: "0.82rem" }}
                      onClick={() => handleOpenEnrollment(c)}
                    >
                      👥 Enrollments ({c.enrolledStudents?.length || 0})
                    </button>
                    <button
                      className="btn-icon-edit"
                      title="Edit Course"
                      onClick={() => handleOpenEdit(c)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon-delete"
                      title="Delete Course"
                      onClick={() => handleDeleteCourse(c._id, c.courseCode)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Course Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {isEditing ? "Edit Course Details" : "Add New Academic Course"}
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
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS301"
                      value={formData.courseCode}
                      onChange={(e) =>
                        setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Course Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Database Systems"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester (1-8) *</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      className="form-input"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Credits (1-6) *</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      className="form-input"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Instructor Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Robert Vance"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Syllabus, topics, and learning objectives..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {isSubmitting ? "Saving..." : isEditing ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Student Enrollments Modal */}
        {enrollModalOpen && selectedCourse && (
          <div className="modal-overlay" onClick={() => setEnrollModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Course Enrollments</h2>
                  <span style={{ fontSize: "0.85rem", color: "#00b4d8" }}>
                    {selectedCourse.courseCode} — {selectedCourse.courseName}
                  </span>
                </div>
                <button className="modal-close" onClick={() => setEnrollModalOpen(false)}>
                  ✕
                </button>
              </div>

              {/* Assign Student Form */}
              <form onSubmit={handleAssignStudent} style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>
                  Enroll a Student:
                </label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <select
                    className="form-select"
                    style={{ flex: 1 }}
                    value={selectedStudentToEnroll}
                    onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                  >
                    <option value="">-- Choose student from directory --</option>
                    {allStudents
                      .filter(
                        (s) =>
                          !selectedCourse.enrolledStudents?.some(
                            (es) => (es._id || es) === s._id
                          )
                      )
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.rollNumber} - {s.fullName} ({s.department})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isEnrolling || !selectedStudentToEnroll}
                  >
                    {isEnrolling ? "Enrolling..." : "Enroll"}
                  </button>
                </div>
              </form>

              {/* Enrolled Students Table */}
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#ffffff", fontSize: "0.95rem" }}>
                Enrolled Students ({selectedCourse.enrolledStudents?.length || 0}):
              </h4>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #415a77", borderRadius: "8px" }}>
                {!selectedCourse.enrolledStudents || selectedCourse.enrolledStudents.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>
                    No students currently enrolled in this course.
                  </p>
                ) : (
                  <table className="students-table">
                    <tbody>
                      {selectedCourse.enrolledStudents.map((st) => (
                        <tr key={st._id || st}>
                          <td>
                            <span className="roll-badge">{st.rollNumber}</span>
                          </td>
                          <td style={{ color: "#ffffff", fontWeight: 600 }}>{st.fullName}</td>
                          <td style={{ color: "#94a3b8" }}>{st.department}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-icon-delete"
                              title="Remove from course"
                              onClick={() => handleRemoveStudent(st._id || st)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesPage;
