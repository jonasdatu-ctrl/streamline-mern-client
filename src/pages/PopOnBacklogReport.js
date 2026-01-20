// src/pages/PopOnBacklogReport.js
/**
 * PopOn Backlog Report Page Component
 *
 * Displays the PopOn backlog report showing cases in the backlog status
 * that haven't been closed or finalized.
 *
 * Query: Retrieves active cases with their latest transaction status,
 * patient names, received dates, and days in lab information.
 */

import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { MESSAGES } from "../config/constants";

/**
 * PopOn Backlog Report page component
 * Shows a table of cases that are in backlog status
 */
const PopOnBacklogReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch PopOn backlog report data from the server
   */
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/reports/popon-backlog");

        if (!response.ok) {
          throw new Error("Failed to fetch PopOn backlog report data");
        }

        const data = await response.json();
        setReportData(data);
        setError(null);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the report");
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  /**
   * Handle CSV export of report data
   */
  const handleExport = () => {
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare CSV headers
    const headers = [
      "Case ID",
      "First Name",
      "Last Scan Status",
      "Status Group",
      "Date Received",
      "Days In Lab",
      "Last Scan Date",
      "Ship Reference #",
      "Rush Order",
      "Status Code",
      "Ship Carrier ID",
    ];

    // Prepare CSV rows
    const rows = reportData.map((item) => [
      item.Case_ID,
      item.FirstName,
      item.LastScanStatus,
      item.StatusGroup,
      item.DateReceived,
      item.DaysInLab,
      item.LastScanDate,
      item.TRN_SHIP_REF_NUM,
      item.Rush ? "Yes" : "No",
      item.TRN_STATUS_CODE,
      item.ShipCarrierId,
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap cells with special characters
            if (
              typeof cell === "string" &&
              (cell.includes(",") || cell.includes('"'))
            ) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(","),
      ),
    ].join("\n");

    // Download CSV file
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent),
    );
    element.setAttribute("download", "popon-backlog-report.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Layout showLogout={true} title="PopOn Backlog Report">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                PopOn Backlog Report
              </h1>
              <p className="text-gray-600">
                Active cases pending processing and shipment
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={loading || reportData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Cases
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? "-" : reportData.length}
                </p>
              </div>
            </div>
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rush Orders
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {loading
                    ? "-"
                    : reportData.filter((item) => item.Rush).length}
                </p>
              </div>
            </div>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Avg Days in Lab
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {loading
                    ? "-"
                    : Math.round(
                        reportData.reduce(
                          (sum, item) => sum + (item.DaysInLab || 0),
                          0,
                        ) / (reportData.length || 1),
                      )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">{MESSAGES.LOADING}</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
              </div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No backlog cases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Case ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Last Scan Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status Group
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date Received
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Days In Lab
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Last Scan Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Ship Ref #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Rush
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Carrier ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {item.Case_ID}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.FirstName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          {item.LastScanStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.StatusGroup}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.DateReceived}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.DaysInLab}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.LastScanDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.TRN_SHIP_REF_NUM}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.Rush ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.ShipCarrierId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PopOnBacklogReport;
