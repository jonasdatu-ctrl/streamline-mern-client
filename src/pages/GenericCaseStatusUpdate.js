// src/pages/GenericCaseStatusUpdate.js
/**
 * Generic Case Status Update Page Component
 *
 * Allows updating the status of support cases across different systems.
 * Provides a centralized interface for case management and status tracking.
 */

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";

/**
 * Generic Case Status Update page component
 * Provides interface for updating case statuses
 */
const GenericCaseStatusUpdate = () => {
  const { currentUser } = useAuth();

  // Mock data - replace with actual API calls
  const [cases, setCases] = useState([
    {
      id: "CASE-001",
      orderId: "ORD-12345",
      customerName: "John Doe",
      currentStatus: "Received",
      newStatus: "Processing",
      lastUpdated: "2024-01-15 10:30 AM",
      updatedBy: "System",
    },
    {
      id: "CASE-002",
      orderId: "ORD-12346",
      customerName: "Jane Smith",
      currentStatus: "Processing",
      newStatus: "Resolved",
      lastUpdated: "2024-01-15 11:15 AM",
      updatedBy: "Support Agent",
    },
    {
      id: "CASE-003",
      orderId: "ORD-12347",
      customerName: "Bob Johnson",
      currentStatus: "Resolved",
      newStatus: "Closed",
      lastUpdated: "2024-01-15 02:45 PM",
      updatedBy: "Manager",
    },
  ]);

  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const statusOptions = [
    "Received",
    "Processing",
    "Investigating",
    "Waiting for Parts",
    "Repairing",
    "Testing",
    "Resolved",
    "Closed",
    "Escalated",
  ];

  const getStatusColor = (status) => {
    const colors = {
      Received: "bg-blue-100 text-blue-800",
      Processing: "bg-yellow-100 text-yellow-800",
      Investigating: "bg-purple-100 text-purple-800",
      "Waiting for Parts": "bg-orange-100 text-orange-800",
      Repairing: "bg-red-100 text-red-800",
      Testing: "bg-indigo-100 text-indigo-800",
      Resolved: "bg-green-100 text-green-800",
      Closed: "bg-gray-100 text-gray-800",
      Escalated: "bg-pink-100 text-pink-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleStatusUpdate = (caseId) => {
    if (!newStatus) return;

    setCases((prevCases) =>
      prevCases.map((caseItem) =>
        caseItem.id === caseId
          ? {
              ...caseItem,
              currentStatus: caseItem.newStatus,
              newStatus: newStatus,
              lastUpdated: new Date().toLocaleString(),
              updatedBy:
                currentUser?.displayName || currentUser?.email || "Unknown",
            }
          : caseItem
      )
    );

    setSelectedCase(null);
    setNewStatus("");
  };

  const handleBulkUpdate = () => {
    // Implement bulk status update logic
    console.log("Bulk update functionality would go here");
  };

  return (
    <Layout showLogout={true} title="Transaction Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generic Case Status Update
              </h1>
              <p className="text-gray-600 mt-1">
                Update and track case statuses across all systems
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleBulkUpdate}>
                Bulk Update
              </Button>
              <Button variant="primary">Export Report</Button>
            </div>
          </div>
        </div>

        {/* Status Update Form */}
        {selectedCase && (
          <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Update Status for Case {selectedCase.id}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                    selectedCase.newStatus
                  )}`}
                >
                  {selectedCase.newStatus}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select new status...</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate(selectedCase.id)}
                disabled={!newStatus}
              >
                Update Status
              </Button>
              <Button variant="secondary" onClick={() => setSelectedCase(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Cases Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Case Status Overview
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          caseItem.newStatus
                        )}`}
                      >
                        {caseItem.newStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          caseItem.currentStatus
                        )}`}
                      >
                        {caseItem.currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.updatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => setSelectedCase(caseItem)}
                      >
                        Update
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusOptions.slice(0, 4).map((status) => {
            const count = cases.filter((c) => c.newStatus === status).length;
            return (
              <div key={status} className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {status}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      getStatusColor(status).split(" ")[0]
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-current opacity-50"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default GenericCaseStatusUpdate;
