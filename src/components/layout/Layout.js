// src/components/layout/Layout.js
/**
 * Layout Component
 *
 * Provides a consistent layout structure with a vertical sidebar navigation
 * and main content area on the right.
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { NAV_ITEMS, MESSAGES, ROUTES } from "../../config/constants";
import Button from "../common/Button";

/**
 * Layout component with vertical sidebar navigation
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Page content to render
 * @param {boolean} props.showLogout - Whether to show logout button
 * @param {string} props.title - Page title (optional)
 */
const Layout = ({ children, showLogout = false, title = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    "transaction-manager": true,
  }); // Default expanded

  /**
   * Handle user logout
   * Signs out the user and redirects to login page
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error("Error signing out:", error);
      // In a real app, you might show a toast notification here
    }
  };

  /**
   * Toggle menu expansion
   * @param {string} menuKey - The key of the menu to toggle
   */
  const toggleMenuExpansion = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  /**
   * Handle navigation item click
   * @param {string} route - Route to navigate to
   * @param {boolean} hasChildren - Whether the item has children
   * @param {string} menuKey - Menu key for expansion toggle
   */
  const handleNavClick = (route, hasChildren = false, menuKey = null) => {
    if (hasChildren) {
      toggleMenuExpansion(menuKey);
    } else if (route) {
      navigate(route);
      setSidebarOpen(false); // Close mobile sidebar after navigation
    }
  };

  /**
   * Check if a route is currently active
   * @param {string} route - Route to check
   * @returns {boolean} Whether the route is active
   */
  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
            <h1 className="text-xl font-bold text-white">
              {title || "Admin Panel"}
            </h1>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus[item.key];
              const isActive = item.route && isActiveRoute(item.route);

              return (
                <div key={item.key}>
                  {/* Main Menu Item */}
                  <button
                    onClick={() =>
                      handleNavClick(item.route, hasChildren, item.key)
                    }
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-between ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Navigation Icons */}
                      <div className="w-5 h-5 mr-3 flex-shrink-0">
                        {item.key === "home" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                        )}
                        {item.key === "transaction-manager" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        )}
                        {item.key === "users" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                        )}
                        {item.key === "settings" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                        {item.key === "reports" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        )}
                        {item.key === "reports-and-analytics" && (
                          <svg
                            className="w-full h-full"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {/* Expand/Collapse Icon for items with children */}
                    {hasChildren && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Nested Menu Items */}
                  {hasChildren && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const childIsActive = isActiveRoute(child.route);
                        return (
                          <button
                            key={child.key}
                            onClick={() => handleNavClick(child.route)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                              childIsActive
                                ? "bg-blue-500 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-600"
                            }`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Button */}
          {showLogout && (
            <div className="p-4 border-t border-gray-700">
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                className="w-full"
              >
                {MESSAGES.LOGOUT}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="lg:hidden bg-white shadow-sm px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

// Prop types for type checking
Layout.propTypes = {
  children: PropTypes.node.isRequired,
  showLogout: PropTypes.bool,
  title: PropTypes.string,
};

export default Layout;
