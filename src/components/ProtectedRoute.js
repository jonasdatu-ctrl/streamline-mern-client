// src/components/ProtectedRoute.js
/**
 * Protected Route Component
 *
 * Higher-order component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 */

import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES, MESSAGES } from "../config/constants";

/**
 * Protected Route wrapper component
 *
 * Only renders children if user is authenticated.
 * Shows loading state during authentication check.
 * Redirects to login page if user is not authenticated.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Components to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return currentUser ? children : <Navigate to={ROUTES.HOME} />;
};

// Prop types for type checking
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
