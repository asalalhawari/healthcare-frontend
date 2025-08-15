"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false); // done loading
  }, []);

  const login = async (username, password) => {
    try {
      console.log("[v0] AuthContext: Attempting login with username:", username);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3002/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      console.log("[v0] AuthContext: Login response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[v0] AuthContext: Login successful, user data:", data.user);

        setUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        return true;
      } else {
        const errorData = await response.json();
        console.log("[v0] AuthContext: Login failed:", errorData.message);
        return false;
      }
    } catch (error) {
      console.error("[v0] AuthContext: Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
