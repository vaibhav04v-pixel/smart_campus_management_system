// src/components/Navbar.jsx
// Complete responsive navigation bar with campus branding, routes, role badge, and logout.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.85rem 1.75rem",
        background: "#1b263b",
        borderBottom: "1px solid rgba(0, 180, 216, 0.2)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "#ffffff",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>🎓</span>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.5px" }}>
              SmartCampus
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.7rem",
                color: "#00b4d8",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Management Portal
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/") ? "#00b4d8" : "#94a3b8",
              background: isActive("/") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive("/admin") ? "#00b4d8" : "#94a3b8",
                background: isActive("/admin") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              }}
            >
              Admin Portal
            </Link>
          )}
          <Link
            to="/students"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/students") ? "#00b4d8" : "#94a3b8",
              background: isActive("/students") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Students
          </Link>
          <Link
            to="/courses"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/courses") ? "#00b4d8" : "#94a3b8",
              background: isActive("/courses") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Courses
          </Link>
          <Link
            to="/attendance"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/attendance") ? "#00b4d8" : "#94a3b8",
              background: isActive("/attendance") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Attendance
          </Link>
          <Link
            to="/complaints"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/complaints") ? "#00b4d8" : "#94a3b8",
              background: isActive("/complaints") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Complaints
          </Link>
          <Link
            to="/events"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/events") ? "#00b4d8" : "#94a3b8",
              background: isActive("/events") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Events
          </Link>
          <Link
            to="/announcements"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: isActive("/announcements") ? "#00b4d8" : "#94a3b8",
              background: isActive("/announcements") ? "rgba(0, 180, 216, 0.15)" : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            Notices
          </Link>
        </div>
      </div>

      {/* User Information & Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
            {user?.name}
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0.15rem 0.5rem",
              borderRadius: "12px",
              background: isAdmin ? "rgba(0, 180, 216, 0.2)" : "rgba(6, 214, 160, 0.2)",
              color: isAdmin ? "#00b4d8" : "#06d6a0",
              border: `1px solid ${isAdmin ? "#00b4d8" : "#06d6a0"}`,
            }}
          >
            {user?.role}
          </span>
        </div>

        <button
          onClick={logout}
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
