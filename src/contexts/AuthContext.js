// src/contexts/AuthContext.js
/**
 * Authentication Context
 *
 * Provides authentication state management throughout the application.
 * Supports two authentication methods:
 * 1. Firebase Auth (Google OAuth)
 * 2. Local Auth (Username/Password)
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Authentication Context
 * Holds the current user, loading state, and authentication type
 */
const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 * @returns {Object|null} currentUser - Current authenticated user or null
 * @returns {boolean} loading - Whether authentication state is being determined
 * @returns {string} authType - Type of authentication ('firebase' or 'local')
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication context.
 * Checks for Firebase authentication and local JWT token on mount.
 * Manages loading state for both authentication methods.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'firebase' or 'local'

  useEffect(() => {
    /**
     * Combined authentication check
     * Checks Firebase auth and local JWT token
     */
    const checkAuth = async () => {
      try {
        // Check for local JWT token
        const token = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
          // User has local authentication
          setCurrentUser(JSON.parse(storedUser));
          setAuthType("local");
          setLoading(false);
          return; // Don't check Firebase if local auth exists
        }

        // Firebase auth state listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            setAuthType("firebase");
          } else {
            setCurrentUser(null);
            setAuthType(null);
          }
          setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
      } catch (error) {
        console.error("Authentication check error:", error);
        setCurrentUser(null);
        setAuthType(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Logout function
   * Clears both local storage and Firebase session
   */
  const logout = async () => {
    try {
      // Clear local JWT
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Firebase logout if applicable
      if (authType === "firebase" && auth.currentUser) {
        await auth.signOut();
      }

      setCurrentUser(null);
      setAuthType(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /**
   * Context value object
   * Contains current user, loading state, auth type, and logout function
   */
  const value = {
    currentUser,
    loading,
    authType,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Prop types for type checking
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
