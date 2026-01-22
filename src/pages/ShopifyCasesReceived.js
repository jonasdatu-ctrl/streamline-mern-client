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
  const [processingCases, setProcessingCases] = useState([]);
  const [existingCases, setExistingCases] = useState([]);
  const [invalidCases, setInvalidCases] = useState([]);
  const [successfulCases, setSuccessfulCases] = useState([]);
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
    setProcessingCases([]);
    setExistingCases([]);
    setInvalidCases([]);
    setSuccessfulCases([]);

    try {
      // Process each case ID sequentially
      for (const caseId of caseIds) {
        try {
          // Step 1: Check if case exists in database
          const dbCheckResponse = await apiPost("/cases/receive-case", {
            caseId,
          });

          if (dbCheckResponse.status === "success") {
            const caseData = dbCheckResponse.data;

            if (caseData.exists) {
              // Case exists in database - add to existing cases
              setExistingCases((prev) => [
                ...prev,
                {
                  caseId,
                  caseData: caseData.caseData,
                  caseStatus:
                    caseData.caseData?.Status_Streamline_Options || "Unknown",
                  receivedDate: caseData.caseData?.Case_Date_Received || "N/A",
                  isRush: caseData.caseData?.IsRushOrder || false,
                },
              ]);
            } else {
              // Case doesn't exist - add to processing and fetch from Shopify
              setProcessingCases((prev) => [
                ...prev,
                {
                  caseId,
                  status: "Pending Shopify Lookup",
                },
              ]);

              // Step 2: Fetch order from Shopify using caseId as orderId
              try {
                const shopifyResponse = await apiPost("/shopify/fetch-order", {
                  orderId: caseId,
                });

                if (shopifyResponse.status === "success") {
                  const orderData = shopifyResponse.data.orderData;

                  // Log the order object for now (will be DB insertion soon)
                  console.log(`Order data for case ${caseId}:`, orderData);

                  // Remove from processing and add to successful
                  setProcessingCases((prev) =>
                    prev.filter((item) => item.caseId !== caseId),
                  );

                  setSuccessfulCases((prev) => [
                    ...prev,
                    {
                      caseId,
                      orderData,
                      status: "Successfully Processed",
                    },
                  ]);
                } else {
                  // Shopify lookup failed - get reason from response
                  const errorReason =
                    shopifyResponse.message || "Shopify lookup failed";
                  const errorCode = shopifyResponse.code || "UNKNOWN_ERROR";

                  setProcessingCases((prev) =>
                    prev.filter((item) => item.caseId !== caseId),
                  );

                  setInvalidCases((prev) => [
                    ...prev,
                    {
                      caseId,
                      reason: errorReason,
                      errorCode,
                      orderData: null,
                    },
                  ]);
                }
              } catch (shopifyErr) {
                console.error(
                  `Error fetching Shopify order for ${caseId}:`,
                  shopifyErr,
                );

                // Move from processing to invalid
                setProcessingCases((prev) =>
                  prev.filter((item) => item.caseId !== caseId),
                );

                // Extract error message from response if available
                const errorMessage =
                  shopifyErr.message ||
                  shopifyErr.data?.message ||
                  "Order not found in Shopify";

                setInvalidCases((prev) => [
                  ...prev,
                  {
                    caseId,
                    reason: errorMessage,
                    orderData: null,
                  },
                ]);
              }
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
    setProcessingCases([]);
    setExistingCases([]);
    setInvalidCases([]);
    setSuccessfulCases([]);
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

  const totalProcessed =
    processingCases.length + existingCases.length + invalidCases.length + successfulCases.length;
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
                Receive case IDs from Shopify
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-0 bg-white shadow-sm rounded-lg p-6 space-y-4 z-10">
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
                  <p>Processed: {totalProcessed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section - Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processing Cases */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Processing Cases
                  {processingCases.length > 0 && (
                    <span className="ml-2 inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {processingCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Cases currently being processed (pending Shopify lookup)
                </p>
              </div>

              {processingCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No cases currently processing.
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-2">
                    {processingCases.map((item, index) => (
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
              <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Existing Cases
                  {existingCases.length > 0 && (
                    <span className="ml-2 inline-block bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                  <p className="text-gray-500">No existing cases found yet.</p>
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
                          Case Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Received Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Rush
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {existingCases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                            {item.caseId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.caseStatus}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.receivedDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.isRush ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                YES
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                NO
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Invalid Cases */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Invalid Cases
                  {invalidCases.length > 0 && (
                    <span className="ml-2 inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {invalidCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Cases that failed processing
                </p>
              </div>

              {invalidCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No invalid cases yet.</p>
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
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invalidCases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {item.caseId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Failed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Processed Cases (Successfully) */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Processed Cases
                  {successfulCases.length > 0 && (
                    <span className="ml-2 inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {successfulCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  New cases successfully processed from Shopify
                </p>
              </div>

              {successfulCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No successfully processed cases yet.
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {successfulCases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {item.caseId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Success
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
