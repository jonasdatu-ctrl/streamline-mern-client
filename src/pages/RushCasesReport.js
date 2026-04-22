// src/pages/RushCasesReport.js
/**
 * Rush Cases Report Page Component
 *
 * Displays all cases marked as rush orders.
 * Columns: Case ID, Customer Name, Current Status, Status Group, Received Date,
 * Last Status Update, Rush, Doctor Name, Days in Lab
 * Sorted by received date (oldest first), paginated 20 per page.
 * Uses keyset (seek) pagination — constant query cost regardless of depth.
 */

import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

const PAGE_SIZE = 20;

const formatDate = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "-";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

const RushCasesReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // Cursor history allows back-navigation without re-fetching arbitrarily deep pages.
  // cursors[i] is the cursor passed to fetch page i (0-based).
  // cursors[0] is always null (first page needs no cursor).
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0); // 0-based
  const [onlyDelayed, setOnlyDelayed] = useState(false);

  const fetchPage = useCallback(async (cursor, targetIndex, delayed) => {
    setLoading(true);
    setError("");
    try {
      const params = cursor
        ? `?cursorDate=${encodeURIComponent(cursor.date)}&cursorId=${cursor.id}${delayed ? "&onlyDelayed=1" : ""}`
        : delayed ? "?onlyDelayed=1" : "";
      const response = await apiGet(`/reports/rush-cases${params}`);
      if (response.status === "success") {
        setRows(response.data || []);
        const more = Boolean(response.hasMore);
        setHasMore(more);
        setPageIndex(targetIndex);
        // Cache the cursor for the next page if we don't have it yet
        if (more && response.nextCursor) {
          setCursors((prev) => {
            if (prev[targetIndex + 1] !== undefined) return prev;
            const updated = [...prev];
            updated[targetIndex + 1] = response.nextCursor;
            return updated;
          });
        }
      } else {
        setError("Failed to load rush cases.");
        setRows([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load rush cases.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPage(null, 0, onlyDelayed);
  }, [fetchPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleDelayed = () => {
    const next = !onlyDelayed;
    setOnlyDelayed(next);
    setCursors([null]);
    setPageIndex(0);
    fetchPage(null, 0, next);
  };

  const handleNext = () => {
    const nextIndex = pageIndex + 1;
    fetchPage(cursors[nextIndex], nextIndex, onlyDelayed);
  };

  const handlePrev = () => {
    if (pageIndex === 0) return;
    const prevIndex = pageIndex - 1;
    fetchPage(cursors[prevIndex], prevIndex, onlyDelayed);
  };

  return (
    <Layout showLogout={true} title="Rush Cases Report">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-semibold text-gray-900">
              Rush Cases Report
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              All cases marked as rush orders, sorted by received date (oldest
              first).
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Loading rush cases...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Filter toggle */}
                <div className="mb-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleDelayed}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      onlyDelayed
                        ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        onlyDelayed ? "bg-white" : "bg-red-500"
                      }`}
                    />
                    Only display delayed orders (&ge;&nbsp;4 days passed)
                  </button>
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Case ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Customer Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Current Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status Group
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Received Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Last Status Update
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Rush
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Doctor Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Days in Lab
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-6 text-center text-gray-500"
                          >
                            No rush cases found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => {
                          const isRedRow =
            row.Has_1603 === 0 &&
            Number(row.Days_Passed_Not_In_Finishing) >= 4;
                          return (
                          <tr
                            key={row.Case_ID}
                            className={`transition-colors ${
                              isRedRow
                                ? "bg-red-50 hover:bg-red-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className={`px-4 py-3 font-medium ${ isRedRow ? "text-red-900" : "text-gray-900" }`}>
                              {row.Case_ID}
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {row.Customer_Name || "-"}
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {row.Status || "-"}
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {row.Status_Group || "-"}
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {formatDate(row.Received_Date)}
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {formatDate(row.Last_Status_Update)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-md bg-red-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                                Rush
                              </span>
                            </td>
                            <td className={`px-4 py-3 ${ isRedRow ? "text-red-800" : "text-gray-700" }`}>
                              {row.Doctor_Name || "-"}
                            </td>
                            <td className={`px-4 py-3 font-semibold ${ isRedRow ? "text-red-700" : "text-gray-700" }`}>
                              {row.Has_1603 === 1
                                ? ""
                                : row.Days_Passed_Not_In_Finishing != null
                                ? row.Days_Passed_Not_In_Finishing
                                : "-"}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    Page {pageIndex + 1}
                    {!hasMore ? " · Last page" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={pageIndex === 0 || loading}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!hasMore || loading}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RushCasesReport;
