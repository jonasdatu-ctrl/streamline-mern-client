// src/pages/RejectedCasesReport.js
/**
 * Rejected Cases Report Page Component
 *
 * Displays cases whose latest status is one of the rejected POP ON J statuses.
 * Filters by last status update date range and exports the filtered view.
 */

import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

const PAGE_SIZE = 20;
const API_BASE_URL = process.env.REACT_APP_API_URL;

const getLocalDateInputValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const formatDate = (raw) => {
  if (!raw) return "-";

  if (typeof raw === "string") {
    const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    }
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const RejectedCasesReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [cursors, setCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [fromDate, setFromDate] = useState(() => getLocalDateInputValue());
  const [toDate, setToDate] = useState(() => getLocalDateInputValue());
  const [exporting, setExporting] = useState(false);

  const fetchPage = useCallback(
    async (cursor, targetIndex) => {
      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams();
        searchParams.set("fromDate", fromDate);
        searchParams.set("toDate", toDate);

        if (cursor) {
          searchParams.set("cursorDate", cursor.date);
          searchParams.set("cursorId", String(cursor.id));
        }

        const params = searchParams.toString()
          ? `?${searchParams.toString()}`
          : "";
        const response = await apiGet(`/reports/rejected-cases${params}`);

        if (response.status === "success") {
          setRows(response.data || []);
          const more = Boolean(response.hasMore);
          setHasMore(more);
          setPageIndex(targetIndex);

          if (more && response.nextCursor) {
            setCursors((prev) => {
              if (prev[targetIndex + 1] !== undefined) return prev;
              const updated = [...prev];
              updated[targetIndex + 1] = response.nextCursor;
              return updated;
            });
          }
        } else {
          setError("Failed to load rejected cases.");
          setRows([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load rejected cases.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate],
  );

  useEffect(() => {
    setCursors([null]);
    setPageIndex(0);
    fetchPage(null, 0);
  }, [fetchPage]);

  const handleNext = () => {
    const nextIndex = pageIndex + 1;
    const fallbackLastRow = rows.length > 0 ? rows[rows.length - 1] : null;
    const nextCursor =
      cursors[nextIndex] ||
      (fallbackLastRow
        ? {
            date: fallbackLastRow.Cursor_Last_Status_Update,
            id: fallbackLastRow.Case_ID,
          }
        : null);

    if (!nextCursor) {
      return;
    }

    fetchPage(nextCursor, nextIndex);
  };

  const handlePrev = () => {
    if (pageIndex === 0) return;
    const prevIndex = pageIndex - 1;
    fetchPage(cursors[prevIndex], prevIndex);
  };

  const handleExportCurrentFilterView = async () => {
    setExporting(true);
    setError("");

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("fromDate", fromDate);
      searchParams.set("toDate", toDate);

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE_URL}/reports/rejected-cases/export?${searchParams.toString()}`,
        {
          method: "GET",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        let message = "Failed to export rejected cases report.";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // Ignore parse failure and use fallback message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const contentDisposition =
        response.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] || "rejected-cases.csv";

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.message || "Failed to export rejected cases report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout showLogout={true} title="Rejected Cases Report">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-semibold text-gray-900">
              Rejected Cases Report
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Cases whose latest status is one of the POP ON J rejection status
              codes.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    From Date
                  </span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    To Date
                  </span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="flex items-end xl:justify-end">
                  <button
                    type="button"
                    onClick={handleExportCurrentFilterView}
                    disabled={loading || exporting}
                    className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
                  >
                    {exporting ? "Exporting..." : "Export Current Filter View"}
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Loading rejected cases...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
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
                          Last Updated By
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Tag
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Last Status Update
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Received Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Doctor Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-gray-500"
                          >
                            No rejected cases found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr
                            key={row.Case_ID}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {row.Case_ID}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Customer_Name || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Status || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Last_Updated_By || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Tag || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDate(row.Last_Status_Update)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDate(row.Received_Date)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {row.Doctor_Name || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

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
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!hasMore || loading}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
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

export default RejectedCasesReport;
