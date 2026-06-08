import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { ROUTES } from "../config/constants";
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
  const navigate = useNavigate();
  const { caseId: routeCaseId } = useParams();
  const [searchCaseId, setSearchCaseId] = useState(routeCaseId || "");
  const [caseInfo, setCaseInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentCaseId = useMemo(() => {
    const normalized = String(routeCaseId || "").trim();
    return /^\d+$/.test(normalized) ? normalized : "";
  }, [routeCaseId]);

  useEffect(() => {
    setSearchCaseId(currentCaseId);
  }, [currentCaseId]);

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

  const handleSearch = (event) => {
    event.preventDefault();

    const normalized = String(searchCaseId || "")
      .replace(/\D/g, "")
      .trim();

    if (!normalized) {
      setError("Please enter a numeric case ID.");
      return;
    }

    navigate(`${ROUTES.CASES}/${normalized}`);
  };

  return (
    <Layout showLogout title="Cases">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Search Case ID</h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter a case ID to browse its details.
          </p>

          <form onSubmit={handleSearch} className="mt-4 flex gap-3">
            <input
              type="text"
              value={searchCaseId}
              onChange={(event) =>
                setSearchCaseId(String(event.target.value || "").replace(/\D/g, ""))
              }
              placeholder="Enter case ID"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Browse
            </button>
          </form>
        </div>

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
                  <dd className="text-gray-900 font-medium">{caseInfo.Case_ID}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Patient First Name</dt>
                  <dd className="text-gray-900">{caseInfo.Case_Patient_First_Name || "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Received Date</dt>
                  <dd className="text-gray-900">{formatDate(caseInfo.Case_Date_Received)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Current Status</dt>
                  <dd className="text-gray-900">
                    {caseInfo.Status_Streamline_Options || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status ID</dt>
                  <dd className="text-gray-900">{caseInfo.Case_Status_ID ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rush</dt>
                  <dd className="text-gray-900">{caseInfo.IsRushOrder ? "Yes" : "No"}</dd>
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
