// src/context/AuthContext.jsx
// Manages global authentication state across the React application.
// Handles login, registration, persistent sessions via localStorage, and logout.

import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("scms_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("scms_token") || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("scms_token");
    localStorage.removeItem("scms_user");
    setToken(null);
    setUser(null);
  };

  // Validate session on initial application load
  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem("scms_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get("/auth/me");
        if (data?.success && data?.data) {
          setUser(data.data);
          localStorage.setItem("scms_user", JSON.stringify(data.data));
        }
      } catch (err) {
        console.error("Session verification failed:", err?.response?.data?.message || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  // Login handler
  const login = async (email, password, role) => {
    const { data } = await API.post("/auth/login", { email, password, role });
    if (data?.success && data?.data) {
      const { token: receivedToken, ...userData } = data.data;
      localStorage.setItem("scms_token", receivedToken);
      localStorage.setItem("scms_user", JSON.stringify(userData));
      setToken(receivedToken);
      setUser(userData);
      return data;
    }
    throw new Error(data?.message || "Login failed. Please try again.");
  };

  // Register handler
  const register = async ({ name, email, password }) => {
    const { data } = await API.post("/auth/register", {
      name,
      email,
      password,
    });
    if (data?.success && data?.data) {
      const { token: receivedToken, ...userData } = data.data;
      localStorage.setItem("scms_token", receivedToken);
      localStorage.setItem("scms_user", JSON.stringify(userData));
      setToken(receivedToken);
      setUser(userData);
      return data;
    }
    throw new Error(data?.message || "Registration failed. Please try again.");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
