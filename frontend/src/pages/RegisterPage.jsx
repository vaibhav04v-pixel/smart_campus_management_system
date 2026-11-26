// src/pages/RegisterPage.jsx
// Student account registration interface with input validation.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Form validation
    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.request
          ? "Unable to reach the backend API. Confirm the backend is running on port 5000."
          : err?.message) ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Smart Campus</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register a new student account</p>
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: "1.25rem" }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. jdoe@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password (min. 6 characters)
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account?
          <Link className="auth-link" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
