// src/pages/RushCasesReport.js
/**
 * Rush Cases Report Page Component
 *
 * Displays all cases marked as rush orders.
 * Columns: Case ID, Status, Received Date, Last Status Update, Rush, Customer Name
 * Sorted by received date (latest first), paginated 20 per page.
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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (page) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGet(`/reports/rush-cases?page=${page}`);
      if (response.status === "success") {
        setRows(response.data || []);
        setPagination(
          response.pagination || {
            page,
            pageSize: PAGE_SIZE,
            totalCount: 0,
            totalPages: 0,
          },
        );
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

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchPage(newPage);
  };

  const startRow =
    pagination.totalCount === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const endRow = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalCount,
  );

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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-gray-500"
                          >
                            No rush cases found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr
                            key={row.Case_ID}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {row.Case_ID}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Status || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDate(row.Received_Date)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDate(row.Last_Status_Update)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-md bg-red-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                                Rush
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Customer_Name || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">
                      {pagination.totalCount === 0
                        ? "No results"
                        : `Showing ${startRow}–${endRow} of ${pagination.totalCount} cases`}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.page === 1}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ‹
                      </button>

                      {/* Page number buttons (show up to 5 around current) */}
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1,
                      )
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            Math.abs(p - pagination.page) <= 2,
                        )
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            acc.push("...");
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-sm text-gray-500"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handlePageChange(item)}
                              className={`rounded border px-2.5 py-1 text-sm font-medium transition-colors ${
                                item === pagination.page
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {item}
                            </button>
                          ),
                        )}

                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.page === pagination.totalPages}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RushCasesReport;
