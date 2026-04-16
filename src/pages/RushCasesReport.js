// src/pages/RushCasesReport.js
/**
 * Rush Cases Report Page Component
 *
 * Displays all cases marked as rush orders.
 * Columns: Case ID, Status, Received Date, Last Status Update, Rush, Customer Name
 * Sorted by received date (latest first), paginated 20 per page.
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

  const fetchPage = useCallback(async (cursor, targetIndex) => {
    setLoading(true);
    setError("");
    try {
      const params = cursor
        ? `?cursorDate=${encodeURIComponent(cursor.date)}&cursorId=${cursor.id}`
        : "";
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
    fetchPage(null, 0);
  }, [fetchPage]);

  const handleNext = () => {
    const nextIndex = pageIndex + 1;
    fetchPage(cursors[nextIndex], nextIndex);
  };

  const handlePrev = () => {
    if (pageIndex === 0) return;
    const prevIndex = pageIndex - 1;
    fetchPage(cursors[prevIndex], prevIndex);
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
              All cases marked as rush orders, sorted by received date (latest
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
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Case ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
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
                          Customer Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Days Passed not in Finishing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-center text-gray-500"
                          >
                            No rush cases found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => {
                          const isRedRow =
            row.Has_1603 === 1 &&
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
                              {row.Status || "-"}
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
                              {row.Customer_Name || "-"}
                            </td>
                            <td className={`px-4 py-3 font-semibold ${ isRedRow ? "text-red-700" : "text-gray-700" }`}>
                              {row.Days_Passed_Not_In_Finishing != null
                                ? `${row.Days_Passed_Not_In_Finishing}d`
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
