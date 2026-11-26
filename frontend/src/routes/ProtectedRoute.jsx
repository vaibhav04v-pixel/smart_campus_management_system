// src/routes/ProtectedRoute.jsx
// Guards client-side routes against unauthenticated or unauthorized access.

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0d1b2a",
        color: "#00b4d8",
        fontSize: "1.2rem"
      }}>
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0d1b2a",
        color: "#e2e8f0",
        padding: "2rem",
        textAlign: "center"
      }}>
        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>403 - Access Denied</h2>
        <p style={{ maxWidth: "450px", color: "#94a3b8", marginBottom: "1.5rem" }}>
          Your current account role (<strong>{user?.role}</strong>) does not have permission to view this section.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "#00b4d8",
            color: "#0d1b2a",
            padding: "0.6rem 1.2rem",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
