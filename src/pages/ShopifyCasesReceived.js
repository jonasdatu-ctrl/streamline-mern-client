// src/pages/ShopifyCasesReceived.js
/**
 * Shopify Cases Received Page Component
 *
 * Displays a page for processing new Shopify case IDs.
 * - Input field for case IDs (numeral only, one per line)
 * - Process button to process cases one by one via API
 * - Display processed cases
 * - Display existing cases found in database
 */

import React, { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import { apiPost } from "../utils/api";

/**
 * Shopify Cases Received page component
 * Shows interface for processing new Shopify cases
 */
const ShopifyCasesReceived = () => {
  const [caseInput, setCaseInput] = useState("");
  const [processedCases, setProcessedCases] = useState([]);
  const [existingCases, setExistingCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todayDate] = useState(new Date().toLocaleDateString());

  /**
   * Parse input to extract case IDs (one per line, numerals only)
   */
  const parseCaseIds = (input) => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && /^\d+$/.test(line))
      .map((line) => line.trim());
  };

  /**
   * Process all case IDs one by one
   */
  const handleProcess = async () => {
    const caseIds = parseCaseIds(caseInput);

    if (caseIds.length === 0) {
      setError("Please enter valid case IDs (numerals only)");
      return;
    }

    setLoading(true);
    setError(null);
    setProcessedCases([]);
    setExistingCases([]);

    try {
      // Process each case ID sequentially
      for (const caseId of caseIds) {
        try {
          const response = await apiPost("/shopify/process-case", {
            caseId,
          });

          if (response.status === "success") {
            const caseData = response.data;

            if (caseData.exists) {
              // Add to existing cases
              setExistingCases((prev) => [
                ...prev,
                {
                  caseId,
                  caseData: caseData.caseData,
                  caseStatus:
                    caseData.caseData?.Status_Streamline_Options || "Unknown",
                },
              ]);
            } else {
              // Add to processed cases (new) - prepare for Shopify GraphQL
              setProcessedCases((prev) => [
                ...prev,
                {
                  caseId,
                  status: "Pending Shopify Lookup",
                  shopifyRequired: caseData.shopifyRequired,
                },
              ]);
            }
          }
        } catch (err) {
          console.error(`Error processing case ${caseId}:`, err);
          setError(`Error processing case ${caseId}: ${err.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear the input field
   */
  const handleClear = () => {
    setCaseInput("");
    setProcessedCases([]);
    setExistingCases([]);
    setError(null);
  };

  /**
   * Handle input change (allow only digits and newlines)
   */
  const handleInputChange = (e) => {
    let value = e.target.value;
    // Allow digits and newlines only
    value = value.replace(/[^\d\n]/g, "");
    setCaseInput(value);
  };

  const processedCaseCount = processedCases.length + existingCases.length;
  const totalCaseIds = parseCaseIds(caseInput).length;

  return (
    <Layout showLogout={true} title="Shopify Cases Received">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                New Shopify Cases Received - "A" Cases
              </h1>
              <p className="text-gray-600">
                Process incoming case IDs from Shopify
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Case ID Input
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Enter case IDs (numerals only). One per line. Barcode scans
                  automatically add newlines.
                </p>
                <textarea
                  value={caseInput}
                  onChange={handleInputChange}
                  placeholder="Enter case IDs here&#10;123456&#10;789012&#10;..."
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleProcess}
                  disabled={loading || parseCaseIds(caseInput).length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? "Processing..." : "Process"}
                </button>
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">
                  <span className="font-semibold text-gray-900">
                    Today's Date:
                  </span>{" "}
                  {todayDate}
                </p>
                <div className="text-xs text-gray-600">
                  <p>Total IDs: {totalCaseIds}</p>
                  <p>Processed: {processedCaseCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section - Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processed Cases */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Processed Cases
                  {processedCases.length > 0 && (
                    <span className="ml-2 inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {processedCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  New cases not yet in the database
                </p>
              </div>

              {processedCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No processed cases yet. Enter case IDs and click Process.
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-2">
                    {processedCases.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.caseId}
                        </span>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Existing Cases */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Existing Cases
                  {existingCases.length > 0 && (
                    <span className="ml-2 inline-block bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {existingCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Cases already found in the database
                </p>
              </div>

              {existingCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No existing cases found yet. They will appear here when
                    discovered.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Case ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Patient Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Date Received
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Case Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {existingCases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                            {item.caseId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.caseData?.Case_Patient_First_Name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.caseData?.Case_Date_Received || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              {item.caseStatus || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopifyCasesReceived;
