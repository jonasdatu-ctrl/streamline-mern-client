import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

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
          setCaseInfo(response.data.caseInfo || null);
          setWarnings({
            awaitingMyDentalRxImport:
              Boolean(response.data?.warnings?.awaitingMyDentalRxImport),
            isYearEndClosed: Boolean(response.data?.warnings?.isYearEndClosed),
          });
          setAllowSave(Boolean(response.data?.allowSave));
          return;
        }

        setCaseInfo(null);
        setWarnings({
          awaitingMyDentalRxImport: false,
          isYearEndClosed: false,
        });
        setAllowSave(true);
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
    String(caseInfo?.IsRushOrder || "").trim().toUpperCase() === "Y";

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
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Error: CaseID awaiting data import from MyDentalRx. To import immediately, please click{" "}
                    <a
                      className="font-semibold underline"
                      href={importNowUrl}
                    >
                      here
                    </a>
                    .
                  </div>
                )}

                {warnings.isYearEndClosed && (
                  <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-800">
                    CASE INVOICE IS CLOSED. CANNOT SAVE OR ADJUST CASE
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Case ID: {caseVariables.caseId || "-"} - Patient: {patientDisplay || "-"}
                  </h2>
                  {isRushOrder && (
                    <p className="mt-2 text-sm font-bold uppercase tracking-wide text-red-700">
                      Rush Order
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CaseDetails;
