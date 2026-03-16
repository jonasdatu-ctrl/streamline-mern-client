// src/pages/CasesShippedToCustomer.js
/**
 * Cases Shipped to Customer
 *
 * Legacy flow migrated to React:
 * - Load outbound carriers
 * - Barcode parsing (FedEx)
 * - Generate CATN tracking when available
 * - Validate case IDs against approval/open-ticket rules
 * - Ship cases with optional manifest print
 */

import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/layout/Layout";
import { apiGet, apiPost } from "../utils/api";

const BARCODE_LENGTH_22 = 22;
const BARCODE_LENGTH_32 = 32;
const BARCODE_LENGTH_34 = 34;
const BARCODE_ERROR_MESSAGE = "Invalid barcode. Please rescan.";

const parseBarcodeToTracking = (barcode) => {
  const trimmed = String(barcode || "").trim();

  if (trimmed.length === BARCODE_LENGTH_22) {
    return trimmed.substring(7);
  }

  if (trimmed.length === BARCODE_LENGTH_32) {
    return trimmed.substring(16, 28);
  }

  if (trimmed.length === BARCODE_LENGTH_34) {
    return trimmed.substring(22);
  }

  return null;
};

const buildGeneratedTrackingNumber = (carrierId) => {
  const now = new Date();
  return `${carrierId}-${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${Math.floor(Math.random() * 1000) + 1}`;
};

const parseCaseIds = (input) => {
  return String(input || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/[^\d]/g, ""))
    .filter(Boolean);
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
};

const CasesShippedToCustomer = () => {
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState("0");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [caseInput, setCaseInput] = useState("");

  const [validCases, setValidCases] = useState([]);
  const [invalidCases, setInvalidCases] = useState([]);

  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [validatingCases, setValidatingCases] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const todayDate = useMemo(() => new Date().toLocaleDateString(), []);

  const selectedCarrier = useMemo(
    () =>
      carriers.find((carrier) => String(carrier.ID) === selectedCarrierId) ||
      null,
    [carriers, selectedCarrierId],
  );

  const selectedCarrierName = selectedCarrier?.Name || "";
  const isCATN = String(selectedCarrier?.CATN || "").toUpperCase() === "Y";
  const isFedExCarrier = selectedCarrierName.toLowerCase().includes("fedex");

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

  const handleCarrierChange = (event) => {
    setSelectedCarrierId(event.target.value);
    setError("");

    if (
      !event.target.selectedOptions[0]?.text?.toLowerCase().includes("fedex")
    ) {
      setBarcodeValue("");
    }
  };

  const validateBarcodeInput = (rawBarcode) => {
    const parsedTracking = parseBarcodeToTracking(rawBarcode);
    if (!parsedTracking) {
      setError(BARCODE_ERROR_MESSAGE);
      setTrackingNumber("");
      return;
    }

    setTrackingNumber(parsedTracking);
    setError((prev) => (prev === BARCODE_ERROR_MESSAGE ? "" : prev));
  };

  useEffect(() => {
    if (!isFedExCarrier) {
      return;
    }

    const trimmedBarcode = String(barcodeValue || "").trim();
    if (!trimmedBarcode) {
      return;
    }

    const hasExpectedLength = [
      BARCODE_LENGTH_22,
      BARCODE_LENGTH_32,
      BARCODE_LENGTH_34,
    ].includes(trimmedBarcode.length);

    if (!hasExpectedLength) {
      return;
    }

    const timeoutId = setTimeout(() => {
      validateBarcodeInput(trimmedBarcode);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [barcodeValue, isFedExCarrier]);

  const handleBarcodeBlur = () => {
    if (!isFedExCarrier) {
      return;
    }

    const trimmedBarcode = String(barcodeValue || "").trim();
    if (!trimmedBarcode) {
      return;
    }

    validateBarcodeInput(trimmedBarcode);
  };

  const handleGenerateTracking = () => {
    const numericCarrierId = parseInt(selectedCarrierId, 10);
    if (!numericCarrierId || numericCarrierId < 1) {
      setError("Please select a carrier");
      return;
    }

    setTrackingNumber(buildGeneratedTrackingNumber(numericCarrierId));
    setError("");
  };

  const handleValidateCases = async () => {
    const inputCaseIds = parseCaseIds(caseInput);
    if (inputCaseIds.length === 0) {
      setError("Please enter at least one numeric case ID");
      return;
    }

    setValidatingCases(true);
    setError("");

    const existingIds = new Set([
      ...validCases.map((item) => item.caseId),
      ...invalidCases.map((item) => item.caseId),
    ]);

    const nextValidCases = [...validCases];
    const nextInvalidCases = [...invalidCases];
    const seenInInput = new Set();

    for (const caseId of inputCaseIds) {
      if (seenInInput.has(caseId)) {
        nextInvalidCases.push({
          caseId,
          reason: "Duplicate Input",
          details: "",
        });
        continue;
      }

      seenInInput.add(caseId);

      if (existingIds.has(caseId)) {
        nextInvalidCases.push({
          caseId,
          reason: "Duplicate Input",
          details: "",
        });
        continue;
      }

      try {
        const response = await apiPost("/shipping/validate-case", { caseId });
        const result = response?.data || {};

        if (result.valid) {
          nextValidCases.push({
            caseId,
            customerName: result.customerName || "-",
            caseStatus: result.caseStatus || "-",
            receivedDate: result.receivedDate || null,
            lastStatusUpdate: result.lastStatusUpdate || null,
            isRush: Boolean(result.isRush),
          });
          existingIds.add(caseId);
        } else {
          const openCount = parseInt(result.checkOpenTicket, 10) || 0;

          if (!result.invoiceApprovedForPayment) {
            nextInvalidCases.push({
              caseId,
              reason: "Invoice Not Approved",
              details: "Invoice approval for payment is required",
            });
          } else if (openCount > 0) {
            nextInvalidCases.push({
              caseId,
              reason: "Open Ticket",
              details: `Open ticket count: ${openCount}`,
            });
          } else {
            nextInvalidCases.push({
              caseId,
              reason: "Validation Failed",
              details: "Case failed shipping validation",
            });
          }

          existingIds.add(caseId);
        }
      } catch (err) {
        const message = String(err.message || "");
        const normalizedMessage = message.toLowerCase();
        const isNotFound = message.toLowerCase().includes("not found");
        const isPaymentDefault = normalizedMessage.includes("payment default");

        nextInvalidCases.push({
          caseId,
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
        existingIds.add(caseId);
      }
    }

    setValidCases(nextValidCases);
    setInvalidCases(nextInvalidCases);
    setCaseInput("");
    setValidatingCases(false);
  };

  const resetEntryFields = () => {
    setCaseInput("");
    setTrackingNumber("");
    setBarcodeValue("");
    setValidCases([]);
    setInvalidCases([]);
  };

  const handleClearAll = () => {
    resetEntryFields();
    setSelectedCarrierId("0");
    setError("");
  };

  const handleDeleteValidCase = (caseId) => {
    setValidCases((prev) => prev.filter((item) => item.caseId !== caseId));
  };

  const handleDeleteInvalidCase = (caseId) => {
    setInvalidCases((prev) => prev.filter((item) => item.caseId !== caseId));
  };

  const validateSubmissionInput = () => {
    const numericCarrierId = parseInt(selectedCarrierId, 10);

    if (validCases.length === 0) {
      return "Please enter at least one valid case ID";
    }

    if (!numericCarrierId || numericCarrierId < 1) {
      return "Please select a carrier";
    }

    if (!trackingNumber.trim()) {
      return "Please enter a tracking number";
    }

    return "";
  };

  const submitShipment = async (generateManifest) => {
    const validationError = validateSubmissionInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const validCaseIds = validCases.map((item) => item.caseId);

      const response = await apiPost("/shipping/submit", {
        carrierId: parseInt(selectedCarrierId, 10),
        carrierName: selectedCarrierName,
        trackingNumber: trackingNumber.trim(),
        caseIds: validCaseIds,
        generateManifest,
      });

      const responseData = response?.data || {};

      if (generateManifest && responseData.manifestHtml) {
        const printWindow = window.open("about:blank", "_blank");
        if (printWindow) {
          printWindow.document.write(responseData.manifestHtml);
          printWindow.document.close();
        }
      }

      resetEntryFields();
    } catch (err) {
      setError(err.message || "Failed to ship cases");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout showLogout={true} title="Cases Shipped to Customer">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-400 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cases Shipped to Customer
          </h1>
          <p className="text-gray-600">
            Validate cases, assign shipping details, and ship in batch.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="sticky top-0 bg-white shadow-sm rounded-lg border border-gray-400 p-6 space-y-4 z-10">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Case ID Input
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Enter multiple case IDs, one per line.
                </p>
                <textarea
                  value={caseInput}
                  onChange={(event) => setCaseInput(event.target.value)}
                  placeholder="123456&#10;123457&#10;123458"
                  disabled={validatingCases || submitting}
                  className="w-full h-56 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleValidateCases}
                  disabled={submitting || validatingCases}
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

              {/* Stats */}
              <div className="rounded-lg border border-gray-400 p-3">
                <p className="text-xs text-gray-500 mb-1">
                  <span className="font-semibold text-gray-900">
                    Today's Date:
                  </span>{" "}
                  {todayDate}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
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
                          Received Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Status Update
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rush
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
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDisplayDate(item.receivedDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDisplayDate(item.lastStatusUpdate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.isRush ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
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

              <div className="p-6 border-t border-gray-400">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Carrier ID
                    </label>
                    <select
                      value={selectedCarrierId}
                      onChange={handleCarrierChange}
                      disabled={loadingCarriers || submitting}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {(carriers || []).map((carrier) => (
                        <option key={carrier.ID} value={carrier.ID}>
                          {carrier.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={barcodeValue}
                      onChange={(event) => setBarcodeValue(event.target.value)}
                      onBlur={handleBarcodeBlur}
                      disabled={!isFedExCarrier || submitting}
                      placeholder="FedEx barcode"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Tracking Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(event) =>
                          setTrackingNumber(event.target.value)
                        }
                        disabled={submitting}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateTracking}
                        disabled={!isCATN || submitting}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => submitShipment(true)}
                    disabled={submitting || validatingCases}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Ship and Print Manifest
                  </button>
                  <button
                    type="button"
                    onClick={() => submitShipment(false)}
                    disabled={submitting || validatingCases}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Ship Another with Same Carrier
                  </button>
                </div>
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
                          colSpan={4}
                          className="px-4 py-6 text-sm text-gray-500 text-center"
                        >
                          No invalid cases.
                        </td>
                      </tr>
                    )}
                    {invalidCases.map((item, index) => (
                      <tr key={`${item.caseId}-${index}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.caseId}
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
                            onClick={() => handleDeleteInvalidCase(item.caseId)}
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
      </div>
    </Layout>
  );
};

export default CasesShippedToCustomer;
