// src/App.jsx
// Main application router wiring authentication routes and protected views.

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import EventsPage from "./pages/EventsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CoursesPage from "./pages/CoursesPage";
import AttendancePage from "./pages/AttendancePage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Campus Home Dashboard with Live MongoDB Aggregations */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Management Directory */}
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Course Management Catalog */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CoursesPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Attendance Tracking & Reports */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Complaints & Grievance Portal */}
          <Route
            path="/complaints"
            element={
              <ProtectedRoute>
                <ComplaintsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Events & Registration Portal */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Announcements & Bulletins Board */}
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
