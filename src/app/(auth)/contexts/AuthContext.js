"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // check login once on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // browser sends HttpOnly cookie automatically
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUser(userData);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkLoginStatus();
  }, []);

  // 🔹 add a logout function to clear context immediately
  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  // you can also add a login function if you want
  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout, // expose logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
