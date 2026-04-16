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

const toDateInput = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const formatDateDisplay = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "-";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
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

  // Patient subsection editable state
  const [patientFields, setPatientFields] = useState({
    firstName: "",
    lastName: "",
    patientNum: "",
  });
  const [savedPatientFields, setSavedPatientFields] = useState({
    firstName: "",
    lastName: "",
    patientNum: "",
  });
  const [patientSaveMessage, setPatientSaveMessage] = useState("");

  // Dates subsection editable state
  const [dateFields, setDateFields] = useState({
    dueDate: "",
    estimatedDeliveryDate: "",
  });
  const [savedDateFields, setSavedDateFields] = useState({
    dueDate: "",
    estimatedDeliveryDate: "",
  });
  const [dateSaveMessage, setDateSaveMessage] = useState("");

  // Rush Order & Clinic Auth# subsection editable state
  const [detailFields, setDetailFields] = useState({
    isRushOrder: false,
    clinicAuthNumber: "",
  });
  const [savedDetailFields, setSavedDetailFields] = useState({
    isRushOrder: false,
    clinicAuthNumber: "",
  });
  const [detailSaveMessage, setDetailSaveMessage] = useState("");

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
          const initialPatient = {
            firstName: String(
              nextCaseInfo?.Case_Patient_First_Name || "",
            ).trim(),
            lastName: String(nextCaseInfo?.Case_Patient_Last_Name || "").trim(),
            patientNum: String(nextCaseInfo?.Case_Patient_Num || "").trim(),
          };
          setPatientFields(initialPatient);
          setSavedPatientFields(initialPatient);
          setPatientSaveMessage("");

          const initialDate = {
            dueDate: toDateInput(nextCaseInfo?.Case_Date_Required_By_DR),
            estimatedDeliveryDate: toDateInput(
              nextCaseInfo?.Case_Date_Estimated_Return,
            ),
          };
          setDateFields(initialDate);
          setSavedDateFields(initialDate);
          setDateSaveMessage("");

          const initialDetail = {
            isRushOrder:
              String(nextCaseInfo?.IsRushOrder || "")
                .trim()
                .toUpperCase() === "Y",
            clinicAuthNumber: String(
              nextCaseInfo?.Case_Clinic_PO_Number || "",
            ).trim(),
          };
          setDetailFields(initialDetail);
          setSavedDetailFields(initialDetail);
          setDetailSaveMessage("");
          return;
        }

        setCaseInfo(null);
        setWarnings({
          awaitingMyDentalRxImport: false,
          isYearEndClosed: false,
        });
        setAllowSave(true);
        setPatientFields({ firstName: "", lastName: "", patientNum: "" });
        setSavedPatientFields({ firstName: "", lastName: "", patientNum: "" });
        setPatientSaveMessage("");
        setDateFields({ dueDate: "", estimatedDeliveryDate: "" });
        setSavedDateFields({ dueDate: "", estimatedDeliveryDate: "" });
        setDateSaveMessage("");
        setDetailFields({ isRushOrder: false, clinicAuthNumber: "" });
        setSavedDetailFields({ isRushOrder: false, clinicAuthNumber: "" });
        setDetailSaveMessage("");
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

  const isRushOrder = caseInfo ? savedDetailFields.isRushOrder : false;

  // Patient handlers
  const hasPatientChanges =
    patientFields.firstName !== savedPatientFields.firstName ||
    patientFields.lastName !== savedPatientFields.lastName ||
    patientFields.patientNum !== savedPatientFields.patientNum;

  const handlePatientFieldChange = (field, value) => {
    setPatientFields((prev) => ({ ...prev, [field]: value }));
    setPatientSaveMessage("");
  };

  const handlePatientSave = () => {
    setSavedPatientFields(patientFields);
    setPatientSaveMessage("Patient information saved.");
  };

  const handlePatientDiscard = () => {
    setPatientFields(savedPatientFields);
    setPatientSaveMessage("Changes discarded.");
  };

  // Date handlers
  const hasDateChanges =
    dateFields.dueDate !== savedDateFields.dueDate ||
    dateFields.estimatedDeliveryDate !== savedDateFields.estimatedDeliveryDate;

  const handleDateFieldChange = (field, value) => {
    setDateFields((prev) => ({ ...prev, [field]: value }));
    setDateSaveMessage("");
  };

  const handleDateSave = () => {
    setSavedDateFields(dateFields);
    setDateSaveMessage("Dates saved.");
  };

  const handleDateDiscard = () => {
    setDateFields(savedDateFields);
    setDateSaveMessage("Changes discarded.");
  };

  // Rush Order & Clinic Auth# handlers
  const hasDetailChanges =
    detailFields.isRushOrder !== savedDetailFields.isRushOrder ||
    detailFields.clinicAuthNumber !== savedDetailFields.clinicAuthNumber;

  const handleDetailFieldChange = (field, value) => {
    setDetailFields((prev) => ({ ...prev, [field]: value }));
    setDetailSaveMessage("");
  };

  const handleDetailSave = () => {
    setSavedDetailFields(detailFields);
    setDetailSaveMessage("Details saved.");
  };

  const handleDetailDiscard = () => {
    setDetailFields(savedDetailFields);
    setDetailSaveMessage("Changes discarded.");
  };

  const doctorDisplayName = (() => {
    const last = String(caseInfo?.DoctorLastName || "").trim();
    const first = String(caseInfo?.DoctorFirstName || "").trim();
    const customer = String(caseInfo?.Customer_Display_Name || "").trim();
    const name = [last && first ? `Dr. ${last}, ${first}` : "", customer]
      .filter(Boolean)
      .join(" - ");
    return name || "-";
  })();

  const actionButtons = [
    "View Internal RX",
    "Update Status",
    "Digital Redo",
    "Generate Invoice",
    "Customer Portal",
    "Shopify",
  ];

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
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-red-700 flex items-center gap-1">
                            Case Status
                            {caseInfo?.Status_Description && (
                              <span className="relative group">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold cursor-default select-none">
                                  ?
                                </span>
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-gray-800 px-3 py-2 text-xs font-normal normal-case text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-normal">
                                  {caseInfo.Status_Description}
                                </span>
                              </span>
                            )}
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">
                            {caseInfo?.Status_Streamline_Options || "-"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Lab
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                            {getLabDisplay(caseInfo) || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Information */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Doctor Information
                      </h4>

                      <p className="mt-2 text-base font-semibold text-gray-800">
                        {doctorDisplayName}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <a
                          href="#"
                          className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          &gt;&gt; Doctor History
                        </a>
                        <a
                          href="#"
                          className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          &gt;&gt; Edit Doctor Profile
                        </a>
                        <a
                          href="#"
                          className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          &gt;&gt; New Doctor
                        </a>
                      </div>
                    </div>

                    {/* Patient */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Patient
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-gray-800">
                          {[patientFields.firstName, patientFields.lastName]
                            .filter(Boolean)
                            .join(" ") || "-"}
                          {patientFields.patientNum
                            ? ` #${patientFields.patientNum}`
                            : ""}
                        </span>
                        <a
                          href="#"
                          className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          &gt;&gt; Change Patient in Current Case
                        </a>
                        <a
                          href="#"
                          className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          &gt;&gt; Change Patient for Multiple Cases
                        </a>
                      </div>

                      {caseInfo?.Shopify_Email && (
                        <p className="mt-1 text-sm text-gray-600">
                          Shopify Email: {caseInfo.Shopify_Email}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            First Name
                          </span>
                          <input
                            type="text"
                            value={patientFields.firstName}
                            onChange={(e) =>
                              handlePatientFieldChange(
                                "firstName",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Last Name
                          </span>
                          <input
                            type="text"
                            value={patientFields.lastName}
                            onChange={(e) =>
                              handlePatientFieldChange(
                                "lastName",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Patient #
                          </span>
                          <input
                            type="text"
                            value={patientFields.patientNum}
                            onChange={(e) =>
                              handlePatientFieldChange(
                                "patientNum",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>

                      {hasPatientChanges && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePatientSave}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handlePatientDiscard}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Discard Changes
                          </button>
                        </div>
                      )}

                      {patientSaveMessage && (
                        <p className="mt-3 text-sm text-green-700">
                          {patientSaveMessage}
                        </p>
                      )}
                    </div>

                    {/* Shipping & Billing */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Shipping &amp; Billing
                      </h4>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Bill To
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                            <p>{caseInfo?.Customer_Display_Name || "-"}</p>
                            {caseInfo?.Customer_Account_Number && (
                              <p className="text-xs text-gray-500">
                                Acct: {caseInfo.Customer_Account_Number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Ship To
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                            <p>{caseInfo?.Customer_Display_Name || "-"}</p>
                            {caseInfo?.Customer_Account_Number && (
                              <p className="text-xs text-gray-500">
                                Acct: {caseInfo.Customer_Account_Number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Dates
                      </h4>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Due Date
                          </span>
                          <input
                            type="date"
                            value={dateFields.dueDate}
                            onChange={(e) =>
                              handleDateFieldChange("dueDate", e.target.value)
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Est. Delivery Date
                          </span>
                          <input
                            type="date"
                            value={dateFields.estimatedDeliveryDate}
                            onChange={(e) =>
                              handleDateFieldChange(
                                "estimatedDeliveryDate",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Original Due Date
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                            {formatDateDisplay(caseInfo?.OriginalRXDueDate)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Lag Time
                          </span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900">
                            {caseInfo?.LagTime != null
                              ? `${caseInfo.LagTime} days`
                              : "-"}
                          </div>
                        </div>
                      </div>

                      {hasDateChanges && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDateSave}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleDateDiscard}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Discard Changes
                          </button>
                        </div>
                      )}

                      {dateSaveMessage && (
                        <p className="mt-3 text-sm text-green-700">
                          {dateSaveMessage}
                        </p>
                      )}
                    </div>

                    {/* Rush Order & Clinic Auth# */}
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Order Details
                      </h4>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Rush Order
                          </span>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={detailFields.isRushOrder}
                              onChange={(e) =>
                                handleDetailFieldChange(
                                  "isRushOrder",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">
                              Rush Order
                            </span>
                          </label>
                        </div>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Clinic Auth #
                          </span>
                          <input
                            type="text"
                            value={detailFields.clinicAuthNumber}
                            onChange={(e) =>
                              handleDetailFieldChange(
                                "clinicAuthNumber",
                                e.target.value,
                              )
                            }
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                          />
                        </label>
                      </div>

                      {hasDetailChanges && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDetailSave}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleDetailDiscard}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Discard Changes
                          </button>
                        </div>
                      )}

                      {detailSaveMessage && (
                        <p className="mt-3 text-sm text-green-700">
                          {detailSaveMessage}
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
