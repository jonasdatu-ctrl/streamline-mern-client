// src/App.js
/**
 * Main Application Component
 *
 * Root component that sets up routing, authentication, and global layout.
 * Handles the overall application structure and navigation flow.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ShopifyCasesReceived from "./pages/ShopifyCasesReceived";
import GenericCaseStatusUpdate from "./pages/GenericCaseStatusUpdate";
import CasesShippedToCustomer from "./pages/CasesShippedToCustomer";
import PopOnBacklogReport from "./pages/PopOnBacklogReport";
import { ROUTES } from "./config/constants";

/**
 * Main App component
 *
 * Sets up the application with:
 * - Authentication context provider
 * - React Router for navigation
 * - Protected routes for authenticated pages
 * - Global CSS styles
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public route - Login page */}
            <Route path={ROUTES.HOME} element={<Login />} />

            {/* Protected route - Dashboard (requires authentication) */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Transaction Manager nested pages */}
            <Route
              path={ROUTES.SHOPIFY_CASES_RECEIVED}
              element={
                <ProtectedRoute>
                  <ShopifyCasesReceived />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.GENERIC_CASE_STATUS_UPDATE}
              element={
                <ProtectedRoute>
                  <GenericCaseStatusUpdate />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CASES_SHIPPED_TO_CUSTOMER}
              element={
                <ProtectedRoute>
                  <CasesShippedToCustomer />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Reports and Analytics nested pages */}
            <Route
              path={ROUTES.POPON_BACKLOG_REPORT}
              element={
                <ProtectedRoute>
                  <PopOnBacklogReport />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
