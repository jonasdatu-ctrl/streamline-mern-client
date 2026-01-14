// src/pages/Dashboard.js
/**
 * Dashboard Page Component
 *
 * Main admin dashboard page that displays after successful authentication.
 * Provides navigation to different admin sections and user management.
 */

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { MESSAGES } from "../config/constants";
import Layout from "../components/layout/Layout";

/**
 * Dashboard page component
 * Shows the main admin interface with navigation and welcome content
 */
const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <Layout showLogout={true} title={MESSAGES.DASHBOARD_TITLE}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600 mb-6">{MESSAGES.WELCOME_MESSAGE}</p>

          {/* User Info */}
          {currentUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Welcome back!
              </h2>
              <p className="text-blue-700">
                Logged in as:{" "}
                <span className="font-medium">
                  {currentUser.displayName || currentUser.email}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions / Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Example stat cards - replace with real data */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                <p className="text-2xl font-bold text-blue-600">1,234</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Total registered users</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                <p className="text-2xl font-bold text-green-600">567</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
                <p className="text-2xl font-bold text-purple-600">$12,345</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
                <p className="text-2xl font-bold text-orange-600">23</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Pending review</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600">New user registered</p>
              <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Order #1234 completed</p>
              <span className="text-xs text-gray-400 ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p className="text-sm text-gray-600">
                System maintenance scheduled
              </p>
              <span className="text-xs text-gray-400 ml-auto">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
