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

const CasesShippedToCustomer = () => {
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState("0");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [caseIdInput, setCaseIdInput] = useState("");

  const [validCases, setValidCases] = useState([]);
  const [invalidCases, setInvalidCases] = useState([]);
  const [manifestHtml, setManifestHtml] = useState("");

  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [validatingCase, setValidatingCase] = useState(false);
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

  const handleBarcodeKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const parsedTracking = parseBarcodeToTracking(barcodeValue);
    if (!parsedTracking) {
      setError("Invalid barcode. Please rescan.");
      setTrackingNumber("");
      return;
    }

    setError("");
    setTrackingNumber(parsedTracking);
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

  const caseAlreadyListed = (caseId) => {
    return (
      validCases.includes(caseId) ||
      invalidCases.some((item) => item.caseId === caseId)
    );
  };

  const handleAddCase = async () => {
    const caseId = caseIdInput.trim();

    if (!caseId) {
      return;
    }

    if (!/^\d+$/.test(caseId)) {
      setError("Case ID must contain numerals only");
      return;
    }

    if (caseAlreadyListed(caseId)) {
      setError("This case ID has already been added");
      setCaseIdInput("");
      return;
    }

    setValidatingCase(true);
    setError("");

    try {
      const response = await apiPost("/shipping/validate-case", { caseId });
      const result = response?.data || {};

      if (result.valid) {
        setValidCases((prev) => [...prev, caseId]);
      } else {
        const reason = !result.invoiceApprovedForPayment
          ? "Invoice not approved for payment"
          : "Open ticket exists";

        setInvalidCases((prev) => [
          ...prev,
          {
            caseId,
            reason,
            openTicketCount: result.checkOpenTicket || 0,
          },
        ]);
      }

      setCaseIdInput("");
    } catch (err) {
      setError(err.message || "Failed to retrieve open ticket count");
      setCaseIdInput("");
    } finally {
      setValidatingCase(false);
    }
  };

  const resetEntryFields = () => {
    setCaseIdInput("");
    setTrackingNumber("");
    setBarcodeValue("");
    setValidCases([]);
    setInvalidCases([]);
    setManifestHtml("");
  };

  const handleClearAll = () => {
    resetEntryFields();
    setSelectedCarrierId("0");
    setError("");
  };

  const handleDeleteValidCase = (caseId) => {
    setValidCases((prev) => prev.filter((id) => id !== caseId));
  };

  const handleDeleteInvalidCase = (caseId) => {
    setInvalidCases((prev) => prev.filter((item) => item.caseId !== caseId));
  };

  const validateSubmissionInput = () => {
    const numericCarrierId = parseInt(selectedCarrierId, 10);

    if (!numericCarrierId || numericCarrierId < 1) {
      return "Please select a carrier";
    }

    if (validCases.length === 0) {
      return "Please enter at least one valid case ID";
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
      const response = await apiPost("/shipping/submit", {
        carrierId: parseInt(selectedCarrierId, 10),
        carrierName: selectedCarrierName,
        trackingNumber: trackingNumber.trim(),
        caseIds: validCases,
        generateManifest,
      });

      const responseData = response?.data || {};

      if (generateManifest && responseData.manifestHtml) {
        setManifestHtml(responseData.manifestHtml);

        const printWindow = window.open("about:blank", "_blank");
        if (printWindow) {
          printWindow.document.write(responseData.manifestHtml);
          printWindow.document.close();
        }
      } else {
        resetEntryFields();
      }
    } catch (err) {
      setError(err.message || "Failed to ship cases");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCaseIdKeyDown = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleAddCase();
    }
  };

  return (
    <Layout showLogout={true} title="Cases Shipped to Customer">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
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
            <div className="sticky top-0 bg-white shadow-sm rounded-lg p-6 space-y-4 z-10">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Carrier
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
                  Barcode (FedEx only)
                </label>
                <input
                  type="text"
                  value={barcodeValue}
                  onChange={(event) => setBarcodeValue(event.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  disabled={!isFedExCarrier || submitting}
                  placeholder="Scan barcode and press Enter"
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
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                      }
                    }}
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Case ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={caseIdInput}
                    onChange={(event) =>
                      setCaseIdInput(event.target.value.replace(/[^\d]/g, ""))
                    }
                    onKeyDown={handleCaseIdKeyDown}
                    disabled={submitting || validatingCase}
                    placeholder="Enter case ID"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddCase}
                    disabled={
                      submitting || validatingCase || !caseIdInput.trim()
                    }
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => submitShipment(true)}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Print Manifest
                </button>
                <button
                  type="button"
                  onClick={() => submitShipment(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Ship Another
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={submitting}
                  className="sm:col-span-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:bg-gray-100"
                >
                  Clear All
                </button>
              </div>
              {/* Stats */}
              <div className="pt-4 border-t border-gray-200">
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
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Valid Cases
                    </h2>
                    <span className="text-sm font-medium text-green-700">
                      Count: {validCases.length}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg min-h-[180px] p-3 space-y-2">
                    {validCases.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No valid cases added yet.
                      </p>
                    )}
                    {validCases.map((caseId) => (
                      <div
                        key={caseId}
                        className="flex items-center justify-between px-3 py-2 rounded bg-green-50 border border-green-100"
                      >
                        <span className="text-sm font-medium text-green-900">
                          {caseId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteValidCase(caseId)}
                          className="text-xs px-2 py-1 rounded bg-white border border-green-200 hover:bg-green-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Invalid Cases
                    </h2>
                    <span className="text-sm font-medium text-red-700">
                      Count: {invalidCases.length}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg min-h-[180px] p-3 space-y-2">
                    {invalidCases.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No invalid cases added yet.
                      </p>
                    )}
                    {invalidCases.map((item) => (
                      <div
                        key={item.caseId}
                        className="px-3 py-2 rounded bg-red-50 border border-red-100"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-red-900">
                            {item.caseId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvalidCase(item.caseId)}
                            className="text-xs px-2 py-1 rounded bg-white border border-red-200 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Manifest Preview
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                This updates when you click Print Manifest.
              </p>
              {manifestHtml ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden h-[360px]">
                  <iframe
                    title="Shipping Manifest"
                    srcDoc={manifestHtml}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-sm text-gray-500">
                  No manifest generated yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CasesShippedToCustomer;
