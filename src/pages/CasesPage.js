import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

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
  const isRush =
    Number(caseInfo?.IsRushOrderFlag) === 1 || caseInfo?.IsRushOrder === "Y";

  return (
    <Layout showLogout title="Cases">
      <div className="space-y-6">
        {headerCaseId && (
          <div
            className={`shadow-sm rounded-lg border p-6 ${
              isRush ? "bg-red-700 border-red-800" : "bg-white border-gray-400"
            }`}
          >
            <h1
              className={`text-3xl font-bold ${
                isRush ? "text-yellow-300" : "text-gray-900"
              }`}
            >
              Case ID: {headerCaseId} - Patient: {headerPatientName} #
              {headerPatientNumber}
            </h1>
          </div>
        )}

        {!currentCaseId && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-400 p-6 text-sm text-gray-600">
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

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 1: GENERAL CASE INFO
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 2: PATIENT INFO
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 3: CASE TRANSACTIONS
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 4: BILLING INFO
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 5: IMAGES
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 6: CASE FILES
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>
      </div>
    </Layout>
  );
};

export default CasesPage;
