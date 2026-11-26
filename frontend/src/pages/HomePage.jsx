// src/pages/HomePage.jsx
// Authenticated landing view demonstrating role permissions, token handling, and logout.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api/axios";

const HomePage = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  // Test /api/auth/me endpoint
  const handleTestProfile = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await API.get("/auth/me");
      setTestResult({
        type: "success",
        status: res.status,
        endpoint: "GET /api/auth/me",
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        status: err?.response?.status || 500,
        endpoint: "GET /api/auth/me",
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  // Test /api/auth/admin-check endpoint
  const handleTestAdmin = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await API.get("/auth/admin-check");
      setTestResult({
        type: "success",
        status: res.status,
        endpoint: "GET /api/auth/admin-check (Admin Guard)",
        data: res.data,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        status: err?.response?.status || 500,
        endpoint: "GET /api/auth/admin-check (Admin Guard)",
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 10% 20%, #0d1b2a 0%, #0a1128 90%)",
        color: "#e2e8f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <Navbar />

      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          boxSizing: "border-box",
        }}
      >
        {/* Quick Link Card to Students */}
        <div
          style={{
            background: "linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)",
            border: "1px solid rgba(0, 180, 216, 0.3)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0", color: "#ffffff", fontSize: "1.1rem" }}>
              👥 Student Management Directory
            </h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem" }}>
              Stage 3: Search, filter, add, edit, and manage enrolled students
            </p>
          </div>
          <Link
            to="/students"
            style={{
              background: "#00b4d8",
              color: "#0d1b2a",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.9rem",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Open Directory ➔
          </Link>
        </div>

        {/* User Profile Card */}
        <div
          style={{
            background: "#1b263b",
            border: "1px solid rgba(0, 180, 216, 0.2)",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
              borderBottom: "1px solid #415a77",
              paddingBottom: "1.25rem",
            }}
          >
            <div>
              <h1 style={{ margin: "0 0 0.4rem 0", fontSize: "1.5rem", color: "#ffffff" }}>
                Welcome, {user?.name}
              </h1>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>
                {user?.email}
              </p>
            </div>
            <span
              style={{
                background:
                  user?.role === "admin"
                    ? "rgba(0, 180, 216, 0.2)"
                    : "rgba(6, 214, 160, 0.2)",
                color: user?.role === "admin" ? "#00b4d8" : "#06d6a0",
                border: `1px solid ${
                  user?.role === "admin" ? "#00b4d8" : "#06d6a0"
                }`,
                padding: "0.35rem 0.9rem",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              Role: {user?.role}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                background: "#0d1b2a",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #415a77",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Account ID</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontFamily: "monospace",
                  color: "#e2e8f0",
                  marginTop: "0.25rem",
                }}
              >
                {user?._id}
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
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Session Status</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#06d6a0",
                  fontWeight: "600",
                  marginTop: "0.25rem",
                }}
              >
                Active (JWT in localStorage)
              </div>
            </div>
          </div>
        </div>

        {/* Live Role Verification Test Section */}
        <div
          style={{
            background: "#1b263b",
            border: "1px solid rgba(0, 180, 216, 0.2)",
            borderRadius: "12px",
            padding: "2rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#ffffff" }}>
            Role-Based Authorization Testing
          </h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "#94a3b8", fontSize: "0.9rem" }}>
            Test the live Express middleware directly from the browser to demonstrate JWT authentication and role guards to your professor:
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <button
              onClick={handleTestProfile}
              disabled={loadingTest}
              style={{
                background: "#0d1b2a",
                color: "#00b4d8",
                border: "1px solid #00b4d8",
                padding: "0.75rem 1.25rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {loadingTest ? "Testing..." : "Test GET /api/auth/me (All Users)"}
            </button>

            <button
              onClick={handleTestAdmin}
              disabled={loadingTest}
              style={{
                background: "#00b4d8",
                color: "#0d1b2a",
                border: "none",
                padding: "0.75rem 1.25rem",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {loadingTest ? "Testing..." : "Test GET /api/auth/admin-check (Admin Guard)"}
            </button>
          </div>

          {/* Test Response Output Box */}
          {testResult && (
            <div
              style={{
                background: "#0d1b2a",
                border: `1px solid ${
                  testResult.type === "success" ? "#06d6a0" : "#ef4444"
                }`,
                borderRadius: "8px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <span
                  style={{
                    color: testResult.type === "success" ? "#06d6a0" : "#ef4444",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                  }}
                >
                  {testResult.type === "success" ? "✅ HTTP 200 OK" : `⚠️ HTTP ${testResult.status} Error`}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  {testResult.endpoint}
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  background: "rgba(0,0,0,0.4)",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(testResult.data || { error: testResult.message }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
