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

  return date.toLocaleString();
};

const CasesPage = () => {
  const { caseId: routeCaseId } = useParams();
  const [caseInfo, setCaseInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentCaseId = useMemo(() => {
    const normalized = String(routeCaseId || "").trim();
    return /^\d+$/.test(normalized) ? normalized : "";
  }, [routeCaseId]);

  useEffect(() => {
    if (!currentCaseId) {
      setCaseInfo(null);
      setError("");
      return;
    }

    const fetchCase = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiGet(`/cases/get-case/${currentCaseId}`);
        if (response.status !== "success") {
          throw new Error(response.message || "Failed to load case");
        }

        if (!response.data?.exists) {
          setCaseInfo(null);
          setError(`Case ${currentCaseId} was not found.`);
          return;
        }

        setCaseInfo(response.data.caseInfo || null);
      } catch (err) {
        setCaseInfo(null);
        setError(err.message || "Failed to load case");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [currentCaseId]);

  const patientName = [
    caseInfo?.Case_Patient_First_Name,
    caseInfo?.Case_Patient_Last_Name,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  const headerCaseId = caseInfo?.Case_ID || currentCaseId;
  const headerPatientNumber = caseInfo?.Case_Patient_Num || headerCaseId;
  const headerPatientName = patientName || "Unknown";
  const isRush = Boolean(caseInfo?.IsRushOrder);

  return (
    <Layout showLogout title="Cases">
      <div className="max-w-4xl mx-auto space-y-6">
        {headerCaseId && (
          <div
            className={`shadow-sm rounded-lg border p-6 ${
              isRush
                ? "bg-red-700 border-red-800"
                : "bg-white border-gray-400"
            }`}
          >
            <p
              className={`text-base font-semibold ${
                isRush ? "text-yellow-300" : "text-gray-900"
              }`}
            >
              Case ID: {headerCaseId} - Patient: {headerPatientName} #
              {headerPatientNumber}
            </p>
          </div>
        )}

        {!currentCaseId && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
            No case selected.
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            Loading case {currentCaseId}...
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && caseInfo && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Case - {caseInfo.Case_ID}
              </h2>
            </div>

            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Case ID</dt>
                  <dd className="text-gray-900 font-medium">
                    {caseInfo.Case_ID}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Patient First Name</dt>
                  <dd className="text-gray-900">
                    {caseInfo.Case_Patient_First_Name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Received Date</dt>
                  <dd className="text-gray-900">
                    {formatDate(caseInfo.Case_Date_Received)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Current Status</dt>
                  <dd className="text-gray-900">
                    {caseInfo.Status_Streamline_Options || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status ID</dt>
                  <dd className="text-gray-900">
                    {caseInfo.Case_Status_ID ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rush</dt>
                  <dd className="text-gray-900">
                    {caseInfo.IsRushOrder ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CasesPage;
