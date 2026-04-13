import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
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
          return;
        }

        setCaseInfo(null);
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

  const caseDetailsFields = [
    {
      label: "Case ID",
      value: caseInfo?.Case_ID || normalizedCaseId || "-",
    },
    {
      label: "Patient",
      value: patientDisplay || "-",
    },
    {
      label: "Current Status",
      value: caseInfo?.Status_Streamline_Options || "-",
    },
    {
      label: "Rush Order",
      value: Number(caseInfo?.IsRushOrder) === 1 ? "Yes" : "No",
    },
    {
      label: "Case Received",
      value: formatDate(caseInfo?.Case_Date_Received),
    },
    {
      label: "Original Due Date",
      value: formatDate(caseInfo?.OriginalRXDueDate),
    },
  ];

  return (
    <Layout showLogout={true} title="Case Details">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-xl font-semibold text-gray-900">Case Details</h1>
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
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {caseDetailsFields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {field.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {field.value || "-"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CaseDetails;