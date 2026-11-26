// src/api/axios.js
// A pre-configured Axios instance used by all API calls in the frontend.
//
// Why a shared instance?
//   - The base URL comes from VITE_API_URL in .env — one place to change it.
//   - The request interceptor automatically attaches the JWT token to every
//     outgoing request, so individual pages don't have to manage headers.
//   - A response interceptor handles 401 (Unauthorized) globally.

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Runs before every request is sent.
// Reads the JWT from localStorage and adds it as a Bearer token header.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("scms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// Runs on every response.
// If the server returns 401 (token expired or invalid), clear local storage
// and redirect to registration.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("scms_token");
      localStorage.removeItem("scms_user");
      // Keep public auth pages in place so failed credentials remain visible.
      if (!["/register", "/login"].includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
