// src/contexts/AuthContext.js
/**
 * Authentication Context
 *
 * Provides authentication state management throughout the application.
 * Uses Firebase Auth to track user login status and handle authentication changes.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Authentication Context
 * Holds the current user and loading state
 */
const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 * @returns {Object|null} currentUser - Current authenticated user or null
 * @returns {boolean} loading - Whether authentication state is being determined
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication context.
 * Listens for authentication state changes and manages loading state.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Firebase auth state listener
     * Updates currentUser state when authentication state changes
     */
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Context value object
   * Contains current user and loading state
   */
  const value = {
    currentUser,
    loading
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