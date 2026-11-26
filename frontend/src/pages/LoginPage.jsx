import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password, role);
      navigate(
        location.state?.from?.pathname ||
          (role === "admin" ? "/admin" : "/"),
        { replace: true }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          (err?.request
            ? "Unable to reach the backend API. Confirm the backend is running on port 5000."
            : err?.message) ||
          "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Smart Campus</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your campus account</p>
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: "1.25rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="role">
              Portal
            </label>
            <select
              id="role"
              className="form-select"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="student">Student Portal</option>
              <option value="admin">Admin Portal</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          New to Smart Campus?
          <Link className="auth-link" to="/register">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
