import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

const getLabDisplay = (caseInfo) => {
  const name = String(caseInfo?.LabName || "").trim();
  const nation = String(caseInfo?.LabNation || "").trim();
  if (!name) {
    return "";
  }
  return nation ? `${name} - ${nation}` : name;
};

const CaseDetails = () => {
  const { caseId } = useParams();
  const normalizedCaseId = useMemo(
    () => decodeURIComponent(String(caseId || "").trim()),
    [caseId],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [caseInfo, setCaseInfo] = useState(null);
  const [warnings, setWarnings] = useState({
    awaitingMyDentalRxImport: false,
    isYearEndClosed: false,
  });
  const [allowSave, setAllowSave] = useState(true);
  const [editableFields, setEditableFields] = useState({
    statusText: "",
    labText: "",
  });
  const [savedFields, setSavedFields] = useState({
    statusText: "",
    labText: "",
  });
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCaseDetails = async () => {
      if (!normalizedCaseId) {
        if (isMounted) {
          setError("Missing case ID.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiGet(
          `/cases/get-case/${encodeURIComponent(normalizedCaseId)}`,
        );

        if (!isMounted) {
          return;
        }

        if (response.status === "success" && response.data?.exists) {
          const nextCaseInfo = response.data.caseInfo || null;
          setCaseInfo(nextCaseInfo);
          setWarnings({
            awaitingMyDentalRxImport: Boolean(
              response.data?.warnings?.awaitingMyDentalRxImport,
            ),
            isYearEndClosed: Boolean(response.data?.warnings?.isYearEndClosed),
          });
          setAllowSave(Boolean(response.data?.allowSave));
          const initialFields = {
            statusText: String(
              nextCaseInfo?.Status_Streamline_Options || "",
            ).trim(),
            labText: getLabDisplay(nextCaseInfo),
          };
          setEditableFields(initialFields);
          setSavedFields(initialFields);
          setSaveMessage("");
          return;
        }

        setCaseInfo(null);
        setWarnings({
          awaitingMyDentalRxImport: false,
          isYearEndClosed: false,
        });
        setAllowSave(true);
        setEditableFields({
          statusText: "",
          labText: "",
        });
        setSavedFields({
          statusText: "",
          labText: "",
        });
        setSaveMessage("");
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(fetchError.message || "Failed to load case details.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCaseDetails();

    return () => {
      isMounted = false;
    };
  }, [normalizedCaseId]);

  const patientName = [
    caseInfo?.Case_Patient_First_Name,
    caseInfo?.Case_Patient_Last_Name,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  const patientNo = String(caseInfo?.Case_Patient_Num || "").trim();
  const patientDisplay = [patientName, patientNo ? `#${patientNo}` : ""]
    .filter(Boolean)
    .join(" ");

  const isRushOrder =
    Number(caseInfo?.IsRushOrderFlag || 0) === 1 ||
    String(caseInfo?.IsRushOrder || "")
      .trim()
      .toUpperCase() === "Y";

  const hasUnsavedChanges =
    editableFields.statusText !== savedFields.statusText ||
    editableFields.labText !== savedFields.labText;

  const actionButtons = [
    "View Internal RX",
    "Update Status",
    "Digital Redo",
    "Generate Invoice",
    "Customer Portal",
    "Shopify",
  ];

  const handleEditableFieldChange = (field, value) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveMessage("");
  };

  const handleSaveChanges = () => {
    setSavedFields(editableFields);
    setSaveMessage("Changes saved for this section.");
  };

  const handleDiscardChanges = () => {
    setEditableFields(savedFields);
    setSaveMessage("Changes discarded.");
  };

  // Assigned variables for upcoming modules (kept ready for Section 1/2/3 wiring).
  const caseVariables = useMemo(
    () => ({
      caseId: caseInfo?.Case_ID || normalizedCaseId || "",
      caseStatusCode: caseInfo?.Case_Status_Code || "",
      caseTags: caseInfo?.caseTags || "",
      shopifyEmail: caseInfo?.Shopify_Email || "",
      doctorUserId: caseInfo?.UserId || caseInfo?.Case_User_ID || "",
      doctorFirstName: caseInfo?.DoctorFirstName || "",
      doctorLastName: caseInfo?.DoctorLastName || "",
      customerId: caseInfo?.Case_Customer_ID || "",
      customerAccountNumber: caseInfo?.Customer_Account_Number || "",
      customerDisplayName: caseInfo?.Customer_Display_Name || "",
      accountingHold: caseInfo?.AccountingHold || "",
      dueDate: caseInfo?.Case_Date_Required_By_DR || "",
      promisedDate: caseInfo?.Case_Date_Estimated_Return || "",
      dateCaseReceived: caseInfo?.Case_Date_Received || "",
      packageType: caseInfo?.PackageType || "",
      paymentTermId: caseInfo?.PaymentTermId || "",
      poNumber: caseInfo?.PO_Number || "",
      originalRxDueDate: caseInfo?.OriginalRXDueDate || "",
      invoiceApprovedForPayment: caseInfo?.Invoice_Approved_For_Payment || "",
      allowSave,
      warnings,
    }),
    [allowSave, caseInfo, normalizedCaseId, warnings],
  );

  const importNowUrl = useMemo(() => {
    const caseValue = encodeURIComponent(String(normalizedCaseId || "").trim());
    const retUrl = encodeURIComponent(
      `https://www.streamlinedental.com/epanel/EditCase.asp?CaseId=${caseValue}`,
    );
    return `/Secure/ImportMyDentalRxOrders.asp?retUrl=${retUrl}`;
  }, [normalizedCaseId]);

  return (
    <Layout showLogout={true} title="Case Details">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-semibold text-gray-900">
              Case Details
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Core case identity and status information.
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Loading case details...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && !caseInfo && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No case record was found for case ID {normalizedCaseId || "-"}.
              </div>
            )}

            {!loading && !error && caseInfo && (
              <div className="space-y-4">
                {warnings.awaitingMyDentalRxImport && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    Error: CaseID awaiting data import from MyDentalRx. To
                    import immediately, please click{" "}
                    <a className="font-semibold underline" href={importNowUrl}>
                      here
                    </a>
                    .
                  </div>
                )}

                {warnings.isYearEndClosed && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    Case invoice is closed. Cannot save or adjust case.
                  </div>
                )}

                {isRushOrder && (
                  <div>
                    <span className="inline-flex items-center rounded-md bg-red-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Rush Order
                    </span>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Case ID: {caseVariables.caseId || "-"} - Patient:{" "}
                    {patientDisplay || "-"}
                  </h2>
                </div>

                <section className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                        Section 1: General Case Info
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {actionButtons.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100"
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Status
                      </h4>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            Case Status
                          </span>
                          <input
                            type="text"
                            value={editableFields.statusText}
                            onChange={(e) =>
                              handleEditableFieldChange(
                                "statusText",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-blue-500"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Lab
                          </span>
                          <input
                            type="text"
                            value={editableFields.labText}
                            onChange={(e) =>
                              handleEditableFieldChange(
                                "labText",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 focus:border-blue-500"
                          />
                        </label>
                      </div>

                      {hasUnsavedChanges && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveChanges}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleDiscardChanges}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Discard Changes
                          </button>
                        </div>
                      )}

                      {saveMessage && (
                        <p className="mt-3 text-sm text-green-700">
                          {saveMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CaseDetails;
