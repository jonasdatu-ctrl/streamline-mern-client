// src/pages/GenericCaseStatusUpdate.js
/**
 * Generic Case Status Update Page Component
 *
 * Displays a page for updating case statuses.
 * - Input field for case IDs (numeral only, one per line)
 * - Process button to update cases one by one
 * - Display processed cases
 * - Display cases that couldn't be found
 */

import React, { useState } from "react";
import Layout from "../components/layout/Layout";

/**
 * Generic Case Status Update page component
 * Shows interface for updating case statuses
 */
const GenericCaseStatusUpdate = () => {
  const [caseInput, setCaseInput] = useState("");
  const [processingCases, setProcessingCases] = useState([]);
  const [successfulCases, setSuccessfulCases] = useState([]);
  const [notFoundCases, setNotFoundCases] = useState([]);
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
    setSuccessfulCases([]);
    setNotFoundCases([]);

    try {
      // TODO: Process each case ID sequentially
      // For now, we'll just simulate the process
      for (const caseId of caseIds) {
        setProcessingCases((prev) => [
          ...prev,
          {
            caseId,
            status: "Processing...",
          },
        ]);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove from processing
        setProcessingCases((prev) =>
          prev.filter((item) => item.caseId !== caseId),
        );

        // For now, randomly assign to successful or not found
        // In real implementation, this would be based on API response
        if (Math.random() > 0.3) {
          setSuccessfulCases((prev) => [
            ...prev,
            {
              caseId,
              status: "Ready for Update",
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        } else {
          setNotFoundCases((prev) => [
            ...prev,
            {
              caseId,
              reason: "Case not found in database",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Error processing cases:", err);
      setError(`Error processing cases: ${err.message}`);
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
    setSuccessfulCases([]);
    setNotFoundCases([]);
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
    processingCases.length + successfulCases.length + notFoundCases.length;
  const totalCaseIds = parseCaseIds(caseInput).length;

  return (
    <Layout showLogout={true} title="Generic Case Status Update">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Generic Case Status Update
              </h1>
              <p className="text-gray-600">
                Enter case IDs to update their statuses
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
                  Cases currently being processed
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

            {/* Cases Not Found */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cases Not Found
                  {notFoundCases.length > 0 && (
                    <span className="ml-2 inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {notFoundCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Cases that could not be found in the database
                </p>
              </div>

              {notFoundCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No cases not found yet.</p>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notFoundCases.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {item.caseId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ready for Update (Successfully Found) */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ready for Update
                  {successfulCases.length > 0 && (
                    <span className="ml-2 inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {successfulCases.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Cases found and ready for status update
                </p>
              </div>

              {successfulCases.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    No cases ready for update yet.
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
                          Time
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.timestamp}
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

export default GenericCaseStatusUpdate;
