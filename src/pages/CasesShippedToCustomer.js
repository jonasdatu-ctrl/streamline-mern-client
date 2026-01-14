// src/pages/CasesShippedToCustomer.js
/**
 * Cases Shipped to Customer Page Component
 *
 * Tracks and manages cases that have been resolved and shipped back to customers.
 * Provides shipping tracking, delivery confirmation, and customer communication tools.
 */

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";

/**
 * Cases Shipped to Customer page component
 * Manages shipped cases and delivery tracking
 */
const CasesShippedToCustomer = () => {
  const { currentUser } = useAuth();

  // Mock data - replace with actual API calls
  const [shippedCases, setShippedCases] = useState([
    {
      id: "CASE-001",
      orderId: "ORD-12345",
      customerName: "John Doe",
      customerEmail: "john.doe@email.com",
      product: "Wireless Headphones",
      issue: "Not charging",
      resolution: "Replaced charging port",
      shippedDate: "2024-01-16",
      trackingNumber: "TRK123456789",
      carrier: "FedEx",
      status: "In Transit",
      estimatedDelivery: "2024-01-18",
      customerNotified: true,
    },
    {
      id: "CASE-002",
      orderId: "ORD-12346",
      customerName: "Jane Smith",
      customerEmail: "jane.smith@email.com",
      product: "Bluetooth Speaker",
      issue: "Poor sound quality",
      resolution: "Firmware update applied",
      shippedDate: "2024-01-15",
      trackingNumber: "TRK987654321",
      carrier: "UPS",
      status: "Delivered",
      estimatedDelivery: "2024-01-17",
      customerNotified: true,
    },
    {
      id: "CASE-003",
      orderId: "ORD-12347",
      customerName: "Bob Johnson",
      customerEmail: "bob.johnson@email.com",
      product: "Smart Watch",
      issue: "Screen cracked",
      resolution: "Screen replaced",
      shippedDate: "2024-01-14",
      trackingNumber: "TRK456789123",
      carrier: "USPS",
      status: "Delivered",
      estimatedDelivery: "2024-01-16",
      customerNotified: false,
    },
  ]);

  const [selectedCase, setSelectedCase] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "in transit":
        return "bg-blue-100 text-blue-800";
      case "out for delivery":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCarrierIcon = (carrier) => {
    const icons = {
      FedEx: "🚚",
      UPS: "📦",
      USPS: "✉️",
      DHL: "🚀",
    };
    return icons[carrier] || "📦";
  };

  const filteredCases =
    filterStatus === "all"
      ? shippedCases
      : shippedCases.filter(
          (caseItem) =>
            caseItem.status.toLowerCase() === filterStatus.toLowerCase()
        );

  const handleNotifyCustomer = (caseId) => {
    // Implement customer notification logic
    setShippedCases((prevCases) =>
      prevCases.map((caseItem) =>
        caseItem.id === caseId
          ? { ...caseItem, customerNotified: true }
          : caseItem
      )
    );
    console.log(`Notification sent for case ${caseId}`);
  };

  const handleViewTracking = (trackingNumber, carrier) => {
    // Open tracking URL in new tab
    const trackingUrls = {
      FedEx: `https://www.fedex.com/en-us/tracking.html?tracknumbers=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      USPS: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };

    const url = trackingUrls[carrier];
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Layout showLogout={true} title="Transaction Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cases Shipped to Customer
              </h1>
              <p className="text-gray-600 mt-1">
                Track shipped cases and manage delivery confirmations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Shipped</p>
              <p className="text-2xl font-bold text-green-600">
                {shippedCases.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="in transit">In Transit</option>
                <option value="out for delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary">Export Report</Button>
              <Button variant="primary">Bulk Actions</Button>
            </div>
          </div>
        </div>

        {/* Shipped Cases Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipped Cases ({filteredCases.length})
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
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caseItem.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {caseItem.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {caseItem.customerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <span className="mr-2">
                          {getCarrierIcon(caseItem.carrier)}
                        </span>
                        {caseItem.carrier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() =>
                          handleViewTracking(
                            caseItem.trackingNumber,
                            caseItem.carrier
                          )
                        }
                        className="text-blue-600 hover:text-blue-900 underline"
                      >
                        {caseItem.trackingNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          caseItem.status
                        )}`}
                      >
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.estimatedDelivery}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!caseItem.customerNotified && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleNotifyCustomer(caseItem.id)}
                        >
                          Notify
                        </Button>
                      )}
                      <Button size="sm" variant="primary">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
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
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippedCases.filter((c) => c.status === "In Transit").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippedCases.filter((c) => c.status === "Delivered").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Notification
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippedCases.filter((c) => !c.customerNotified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg. Delivery Time
                </p>
                <p className="text-2xl font-bold text-gray-900">2.3 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CasesShippedToCustomer;
