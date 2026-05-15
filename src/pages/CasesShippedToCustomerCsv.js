import React, { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "../components/layout/Layout";
import { apiGet, apiPost } from "../utils/api";

const CARRIER_ID_FEDEX_PAK = "95";
const CARRIER_ID_USPS_POSTAL_SERVICE = "16";
const CARRIER_ID_UPS_DEFAULT_2 = "48";

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const detectCarrierIdFromTrackingNumber = (trackingNumber) => {
  const normalizedTracking = String(trackingNumber || "").trim();

  if (!normalizedTracking) {
    return null;
  }

  if (/^1Z/.test(normalizedTracking.toUpperCase())) {
    return CARRIER_ID_UPS_DEFAULT_2;
  }

  if (/^(420|92|93|94|95)/.test(normalizedTracking)) {
    return CARRIER_ID_USPS_POSTAL_SERVICE;
  }

  if (
    /^(96|97|98|99|7\d{11}|12\d{10}|15\d{10})/.test(normalizedTracking) ||
    /^[19]\d{33}$/.test(normalizedTracking)
  ) {
    return CARRIER_ID_FEDEX_PAK;
  }

  return null;
};

const normalizeCaseId = (value) => {
  const digits = String(value || "").match(/\d+/g);
  if (!digits || digits.length === 0) {
    return "";
  }

  return digits[0].trim();
};

const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
};

const parseCsvRecords = (content) => {
  const records = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      records.push(current);
      current = "";

      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    records.push(current);
  }

  return records;
};

const parseCsvContent = (content) => {
  const normalized = String(content || "").replace(/^\uFEFF/, "");
  if (!normalized) {
    return { rows: [], error: "CSV file is empty" };
  }

  const lines = parseCsvRecords(normalized)
    .map((line) => String(line || "").trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      error: "CSV must include a header row and at least one data row",
    };
  }

  const headers = parseCsvLine(lines[0]);
  const requiredHeaders = [
    "Shipped Date",
    "Employee Name",
    "Order ID",
    "Tracking",
  ];

  const missingHeaders = requiredHeaders.filter(
    (requiredHeader) => !headers.includes(requiredHeader),
  );

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      error: `CSV missing required header(s): ${missingHeaders.join(", ")}`,
    };
  }

  const rows = [];

  let dataRowNumber = 2;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || "";
    });

    const shippedDate = String(row["Shipped Date"] || "").trim();
    const employeeName = String(row["Employee Name"] || "").trim();
    const orderId = String(row["Order ID"] || "").trim();
    const trackingNumber = String(row.Tracking || "").trim();

    const isCompletelyEmpty =
      !shippedDate && !employeeName && !orderId && !trackingNumber;

    if (isCompletelyEmpty) {
      dataRowNumber += 1;
      continue;
    }

    rows.push({
      rowNumber: dataRowNumber,
      shippedDate,
      employeeName,
      orderId,
      trackingNumber,
    });

    dataRowNumber += 1;
  }

  if (rows.length === 0) {
    return {
      rows: [],
      error: "CSV contains no data rows after filtering empty rows",
    };
  }

  return { rows, error: "" };
};

const CasesShippedToCustomerCsv = () => {
  const [carriers, setCarriers] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);

  const [validCases, setValidCases] = useState([]);
  const [invalidCases, setInvalidCases] = useState([]);
  const [shippedCases, setShippedCases] = useState([]);

  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [validatingCases, setValidatingCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [totalCaseShippedToday, setTotalCaseShippedToday] = useState(0);
  const [totalCaseShippedThisWeek, setTotalCaseShippedThisWeek] = useState(0);
  const [totalCaseShippedAllUsersToday, setTotalCaseShippedAllUsersToday] =
    useState(0);
  const [
    totalCaseShippedAllUsersThisWeek,
    setTotalCaseShippedAllUsersThisWeek,
  ] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const carrierNameById = useMemo(() => {
    const map = new Map();
    (carriers || []).forEach((carrier) => {
      map.set(String(carrier.ID), carrier.Name || "");
    });
    return map;
  }, [carriers]);

  const fetchUserStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await apiGet("/shipping/user-stats/today");

      if (response.status === "success") {
        setTotalCaseShippedToday(response.data?.totalCaseShippedToday || 0);
        setTotalCaseShippedThisWeek(
          response.data?.totalCaseShippedThisWeek || 0,
        );
        setTotalCaseShippedAllUsersToday(
          response.data?.totalCaseShippedAllUsersToday || 0,
        );
        setTotalCaseShippedAllUsersThisWeek(
          response.data?.totalCaseShippedAllUsersThisWeek || 0,
        );
      }
    } catch (statsError) {
      console.error("Error fetching user stats:", statsError);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchCarriers = async () => {
      setLoadingCarriers(true);
      try {
        const response = await apiGet("/shipping/carriers");
        setCarriers(response?.data?.carriers || []);
      } catch (err) {
        setError(err.message || "Failed to retrieve carrier names");
      } finally {
        setLoadingCarriers(false);
      }
    };

    fetchCarriers();
  }, []);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const handleDeleteValidCase = (caseId) => {
    setValidCases((prev) => prev.filter((item) => item.caseId !== caseId));
  };

  const handleDeleteInvalidCase = (caseId, rowNumber) => {
    setInvalidCases((prev) =>
      prev.filter(
        (item) => !(item.caseId === caseId && item.rowNumber === rowNumber),
      ),
    );
  };

  const handleDeleteShippedCase = (caseId) => {
    setShippedCases((prev) => prev.filter((item) => item.caseId !== caseId));
  };

  const resetEntryFields = () => {
    setUploadedFileName("");
    setParsedRows([]);
    setValidCases([]);
    setInvalidCases([]);
  };

  const handleClearAll = () => {
    resetEntryFields();
    setError("");
  };

  const validateRows = useCallback(
    async (rowsToValidate) => {
      if (!Array.isArray(rowsToValidate) || rowsToValidate.length === 0) {
        setError("Please upload a CSV with at least one case row");
        return;
      }

      setValidatingCases(true);
      setError("");

      const nextValidCases = [];
      const nextInvalidCases = [];
      const seenCaseIds = new Set();

      for (const row of rowsToValidate) {
        const caseId = normalizeCaseId(row.orderId);
        const employeeName = row.employeeName || "-";
        const shippedDate = row.shippedDate || "-";
        const trackingNumber = row.trackingNumber || "";

        if (!caseId) {
          nextInvalidCases.push({
            rowNumber: row.rowNumber,
            caseId: "-",
            orderId: row.orderId || "-",
            employeeName,
            shippedDate,
            trackingNumber: trackingNumber || "-",
            caseStatus: "-",
            reason: "Invalid Order ID",
            details: "Order ID must contain a numeric case ID",
          });
          continue;
        }

        if (!trackingNumber) {
          nextInvalidCases.push({
            rowNumber: row.rowNumber,
            caseId,
            orderId: row.orderId || "-",
            employeeName,
            shippedDate,
            trackingNumber: "-",
            caseStatus: "-",
            reason: "Missing Tracking",
            details: "Tracking is required in the CSV row",
          });
          continue;
        }

        if (seenCaseIds.has(caseId)) {
          nextInvalidCases.push({
            rowNumber: row.rowNumber,
            caseId,
            orderId: row.orderId || "-",
            employeeName,
            shippedDate,
            trackingNumber,
            caseStatus: "-",
            reason: "Duplicate Input",
            details: "Duplicate case ID in uploaded CSV",
          });
          continue;
        }

        seenCaseIds.add(caseId);

        try {
          const response = await apiPost("/shipping/validate-case", { caseId });
          const result = response?.data || {};

          if (result.valid) {
            const resolvedCarrierId = String(result.shipCarrierId || "").trim();
            const inferredCarrierId =
              detectCarrierIdFromTrackingNumber(trackingNumber);
            const carrierId = resolvedCarrierId || inferredCarrierId || "0";

            if (!parseInt(carrierId, 10) || parseInt(carrierId, 10) < 1) {
              nextInvalidCases.push({
                rowNumber: row.rowNumber,
                caseId,
                orderId: row.orderId || "-",
                employeeName,
                shippedDate,
                trackingNumber,
                caseStatus: result.caseStatus || "-",
                reason: "Carrier Not Resolved",
                details:
                  "Unable to resolve a valid carrier from case or tracking number",
              });
              continue;
            }

            nextValidCases.push({
              rowNumber: row.rowNumber,
              caseId,
              orderId: row.orderId || "-",
              employeeName,
              shippedDate,
              trackingNumber,
              customerName: result.customerName || "-",
              caseStatus: result.caseStatus || "-",
              receivedDate: result.receivedDate || null,
              lastStatusUpdate: result.lastStatusUpdate || null,
              isRush: Boolean(result.isRush),
              carrierId,
              carrierName: carrierNameById.get(carrierId) || "-",
            });
          } else {
            const openCount = parseInt(result.checkOpenTicket, 10) || 0;
            const isPaymentDefault =
              String(result.reasonCode || "").toUpperCase() ===
              "PAYMENT_DEFAULT_CARRIER";

            if (isPaymentDefault) {
              nextInvalidCases.push({
                rowNumber: row.rowNumber,
                caseId,
                orderId: row.orderId || "-",
                employeeName,
                shippedDate,
                trackingNumber,
                caseStatus: result.caseStatus || "-",
                reason: "Payment Default Carrier",
                details:
                  result.message ||
                  "Ship Carrier is set to Payment Default (59)",
              });
            } else if (!result.invoiceApprovedForPayment) {
              nextInvalidCases.push({
                rowNumber: row.rowNumber,
                caseId,
                orderId: row.orderId || "-",
                employeeName,
                shippedDate,
                trackingNumber,
                caseStatus: result.caseStatus || "-",
                reason: "Invoice Not Approved",
                details: "Invoice approval for payment is required",
              });
            } else if (openCount > 0) {
              nextInvalidCases.push({
                rowNumber: row.rowNumber,
                caseId,
                orderId: row.orderId || "-",
                employeeName,
                shippedDate,
                trackingNumber,
                caseStatus: result.caseStatus || "-",
                reason: "Open Ticket",
                details: `Open ticket count: ${openCount}`,
              });
            } else {
              nextInvalidCases.push({
                rowNumber: row.rowNumber,
                caseId,
                orderId: row.orderId || "-",
                employeeName,
                shippedDate,
                trackingNumber,
                caseStatus: result.caseStatus || "-",
                reason: "Validation Failed",
                details: "Case failed shipping validation",
              });
            }
          }
        } catch (err) {
          const message = String(err.message || "");
          const normalizedMessage = message.toLowerCase();
          const isNotFound = normalizedMessage.includes("not found");
          const isPaymentDefault =
            normalizedMessage.includes("payment default");

          nextInvalidCases.push({
            rowNumber: row.rowNumber,
            caseId,
            orderId: row.orderId || "-",
            employeeName,
            shippedDate,
            trackingNumber,
            caseStatus: "-",
            reason: isPaymentDefault
              ? "Payment Default Carrier"
              : isNotFound
                ? "Case Not Found"
                : "Validation Error",
            details: isPaymentDefault
              ? "Ship Carrier is set to Payment Default (59)"
              : isNotFound
                ? "No matching case record was found"
                : message || "Failed to validate case",
          });
        }
      }

      setValidCases(nextValidCases);
      setInvalidCases(nextInvalidCases);
      setValidatingCases(false);
    },
    [carrierNameById],
  );

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const lowerName = String(file.name || "").toLowerCase();
    if (!lowerName.endsWith(".csv")) {
      setError("Please upload a valid .csv file");
      return;
    }

    try {
      const content = await file.text();
      const { rows, error: parseError } = parseCsvContent(content);

      if (parseError) {
        setUploadedFileName(file.name);
        setParsedRows([]);
        setValidCases([]);
        setInvalidCases([]);
        setError(parseError);
        return;
      }

      setUploadedFileName(file.name);
      setParsedRows(rows);
      setError("");
      await validateRows(rows);
    } catch (readError) {
      setError(readError.message || "Failed to read CSV file");
    }
  };

  const handlePrintManifest = () => {
    if (shippedCases.length === 0) {
      setError("No shipped cases available to print");
      return;
    }

    const manifestDate = new Date().toLocaleString();
    const manifestRows = shippedCases
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.caseId)}</td>
            <td>${escapeHtml(item.customerName || "-")}</td>
            <td>${escapeHtml(item.caseStatus || "-")}</td>
            <td>${escapeHtml(item.employeeName || "-")}</td>
            <td>${escapeHtml(item.trackingNumber || "-")}</td>
            <td>${escapeHtml(formatDisplayDate(item.shippedDate))}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) {
      setError(
        "Unable to open print window. Please allow popups and try again",
      );
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Shipping Manifest (CSV)</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .meta { margin-bottom: 16px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 13px; }
            th { background: #f3f4f6; }
            .sign { margin-top: 24px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Shipping Manifest (CSV)</h1>
          <div class="meta">
            <div><strong>Date:</strong> ${escapeHtml(manifestDate)}</div>
            <div><strong>Total Cases:</strong> ${shippedCases.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Case ID</th>
                <th>Customer Name</th>
                <th>Case Status</th>
                <th>Employee Name</th>
                <th>Tracking Number</th>
                <th>Shipped Date</th>
              </tr>
            </thead>
            <tbody>
              ${manifestRows}
            </tbody>
          </table>
          <div class="sign">Sign Here: ______________________</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const submitShipment = async () => {
    if (validCases.length === 0) {
      setError("Please upload and validate at least one valid case");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const groupedPayloads = new Map();

      validCases.forEach((item) => {
        const carrierId = parseInt(item.carrierId, 10);
        if (!carrierId || carrierId < 1) {
          return;
        }

        const tracking = String(item.trackingNumber || "").trim();
        if (!tracking) {
          return;
        }

        const key = `${carrierId}__${tracking}`;
        const existing = groupedPayloads.get(key);

        if (existing) {
          existing.caseIds.push(item.caseId);
        } else {
          groupedPayloads.set(key, {
            carrierId,
            carrierName: carrierNameById.get(String(carrierId)) || "-",
            trackingNumber: tracking,
            caseIds: [item.caseId],
          });
        }
      });

      if (groupedPayloads.size === 0) {
        setError(
          "No valid shipment groups found. Please verify tracking and carrier data in CSV",
        );
        setSubmitting(false);
        return;
      }

      const validCaseMeta = new Map();
      validCases.forEach((item) => {
        validCaseMeta.set(item.caseId, item);
      });

      const processedCasesCombined = [];

      for (const payload of groupedPayloads.values()) {
        const response = await apiPost(
          "/shipping/shipped-to-customer",
          payload,
        );

        const processedCases = Array.isArray(response?.data?.processedCases)
          ? response.data.processedCases
          : payload.caseIds.map((caseId) => ({
              caseId,
              customerName: validCaseMeta.get(caseId)?.customerName || "-",
              caseStatus: "Shipped to Customer",
              shippedDate: new Date().toISOString(),
              trackingNumber: payload.trackingNumber,
              carrierName: payload.carrierName,
            }));

        processedCases.forEach((processedItem) => {
          const caseId = String(processedItem.caseId || "").trim();
          if (!caseId) {
            return;
          }

          const rowMeta = validCaseMeta.get(caseId);

          processedCasesCombined.push({
            caseId,
            customerName:
              processedItem.customerName || rowMeta?.customerName || "-",
            caseStatus: processedItem.caseStatus || "Shipped to Customer",
            shippedDate: rowMeta?.shippedDate || processedItem.shippedDate,
            trackingNumber:
              rowMeta?.trackingNumber ||
              processedItem.trackingNumber ||
              payload.trackingNumber,
            carrierName:
              processedItem.carrierName ||
              rowMeta?.carrierName ||
              payload.carrierName,
            employeeName: rowMeta?.employeeName || "-",
          });
        });
      }

      setShippedCases((prev) => {
        const existingCaseIds = new Set(
          prev.map((item) => String(item.caseId)),
        );
        const merged = [...prev];

        processedCasesCombined.forEach((item) => {
          if (!item.caseId || existingCaseIds.has(item.caseId)) {
            return;
          }

          merged.push(item);
          existingCaseIds.add(item.caseId);
        });

        return merged;
      });

      resetEntryFields();
      await fetchUserStats();
    } catch (err) {
      setError(err.message || "Failed to ship cases");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout showLogout={true} title="Cases Shipped to Customer (CSV)">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-400 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Cases Shipped to Customer
              </h1>
              <p className="text-gray-600">
                Upload CSV, validate cases, and ship cases in batch.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[360px] bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                User Stats
              </p>
              <div className="text-sm text-gray-700 overflow-x-auto">
                <p className="whitespace-nowrap">
                  <span className="text-gray-500">User today:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {statsLoading ? "Loading..." : totalCaseShippedToday}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-500">User week:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {statsLoading ? "Loading..." : totalCaseShippedThisWeek}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-500">All today:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {statsLoading
                      ? "Loading..."
                      : totalCaseShippedAllUsersToday}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-500">All week:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {statsLoading
                      ? "Loading..."
                      : totalCaseShippedAllUsersThisWeek}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="sticky top-0 bg-white shadow-sm rounded-lg border border-gray-400 p-6 space-y-4 z-10">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Case ID Input
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload CSV with headers: Shipped Date, Employee Name, Order
                  ID, Tracking.
                </p>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  disabled={validatingCases || submitting}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />

                {uploadedFileName && (
                  <p className="mt-2 text-xs text-gray-600">
                    Uploaded file:{" "}
                    <span className="font-semibold">{uploadedFileName}</span>
                  </p>
                )}

                {parsedRows.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Parsed rows: {parsedRows.length}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => validateRows(parsedRows)}
                  disabled={
                    submitting || validatingCases || parsedRows.length === 0
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {validatingCases ? "Validating..." : "Validate"}
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={submitting || validatingCases}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:bg-gray-100"
                >
                  Clear
                </button>
              </div>

              <div className="rounded-lg border border-gray-300 p-4 space-y-4">
                <div className="text-xs text-gray-500">
                  Carriers loaded:{" "}
                  {loadingCarriers ? "Loading..." : carriers.length}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={submitShipment}
                    disabled={
                      submitting || validatingCases || validCases.length === 0
                    }
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Ship Cases to Customer
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
                <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Valid Cases
                    </h2>
                    <span className="text-sm font-medium text-green-700">
                      Count: {validCases.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border-b border-gray-400">
                  <table className="min-w-full divide-y divide-gray-200">
                    {validCases.length > 0 && (
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shipped Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tracking Number
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                    )}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validCases.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-6 text-sm text-gray-500 text-center"
                          >
                            No valid cases yet.
                          </td>
                        </tr>
                      )}
                      {validCases.map((item) => (
                        <tr key={item.caseId}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.caseId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.customerName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.caseStatus || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.employeeName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatDisplayDate(item.shippedDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.trackingNumber || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteValidCase(item.caseId)}
                              className="text-xs px-2 py-1 rounded bg-white border border-green-200 hover:bg-green-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
                <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Invalid Cases
                    </h2>
                    <span className="text-sm font-medium text-red-700">
                      Count: {invalidCases.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    {invalidCases.length > 0 && (
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Case Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shipped Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tracking Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                    )}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invalidCases.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-sm text-gray-500 text-center"
                          >
                            No invalid cases.
                          </td>
                        </tr>
                      )}
                      {invalidCases.map((item, index) => (
                        <tr key={`${item.caseId}-${item.rowNumber}-${index}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.caseId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.caseStatus || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.employeeName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatDisplayDate(item.shippedDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.trackingNumber || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-700">
                            {item.reason}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.details || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteInvalidCase(
                                  item.caseId,
                                  item.rowNumber,
                                )
                              }
                              className="text-xs px-2 py-1 rounded bg-white border border-red-200 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
              <div className="bg-sky-50 border-b border-sky-200 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Shipped Cases
                  </h2>
                  <span className="text-sm font-medium text-sky-700">
                    Count: {shippedCases.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border-b border-gray-400">
                <table className="min-w-full divide-y divide-gray-200">
                  {shippedCases.length > 0 && (
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tracking Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shipped Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippedCases.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-sm text-gray-500 text-center"
                        >
                          No shipped cases yet.
                        </td>
                      </tr>
                    )}
                    {shippedCases.map((item) => (
                      <tr key={item.caseId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.caseId}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.customerName || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.caseStatus || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.employeeName || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.trackingNumber || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDisplayDate(item.shippedDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteShippedCase(item.caseId)}
                            className="text-xs px-2 py-1 rounded bg-white border border-sky-200 hover:bg-sky-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-gray-400">
                <button
                  type="button"
                  onClick={handlePrintManifest}
                  disabled={shippedCases.length === 0}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Print Manifest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CasesShippedToCustomerCsv;
