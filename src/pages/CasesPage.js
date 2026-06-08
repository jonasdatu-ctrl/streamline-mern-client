import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { apiGet } from "../utils/api";

const formatUploadDate = (value) => {
  if (!value) {
    return "Upload date unavailable";
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
  const [customerPhotos, setCustomerPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
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

  useEffect(() => {
    if (!currentCaseId) {
      setCustomerPhotos([]);
      setPhotosError("");
      setSelectedPhoto(null);
      return;
    }

    const fetchCustomerPhotos = async () => {
      setPhotosLoading(true);
      setPhotosError("");

      try {
        const response = await apiGet(
          `/cases/${currentCaseId}/customer-photos`,
        );
        if (response.status !== "success") {
          throw new Error(response.message || "Failed to load customer photos");
        }

        setCustomerPhotos(response.data?.photos || []);
      } catch (err) {
        setCustomerPhotos([]);
        setPhotosError(err.message || "Failed to load customer photos");
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchCustomerPhotos();
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
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h3 className="text-base font-semibold text-gray-900">
                  Customer Photos
                </h3>
              </div>

              <div className="p-6">
                {photosLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    Loading customer photos...
                  </div>
                )}

                {!photosLoading && photosError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    {photosError}
                  </div>
                )}

                {!photosLoading &&
                  !photosError &&
                  customerPhotos.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
                      No customer photos found for this case.
                    </div>
                  )}

                {!photosLoading &&
                  !photosError &&
                  customerPhotos.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {customerPhotos.map((photo) => (
                        <button
                          key={photo.ID}
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="group text-left bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-square bg-gray-100 overflow-hidden">
                            <img
                              src={photo.Photo_Link}
                              alt={`Customer upload ${photo.ID}`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[11px] text-gray-600 truncate">
                              Uploaded: {formatUploadDate(photo.CreatedDate)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-400 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              SECTION 6: CASE FILES
            </h2>
          </div>
          <div className="p-6 min-h-[160px]"></div>
        </div>

        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close photo viewer"
            />

            <div className="relative z-10 w-full max-w-6xl">
              <div className="flex items-start justify-between gap-4 mb-4 text-white">
                <div className="text-sm text-gray-300">
                  Uploaded: {formatUploadDate(selectedPhoto.CreatedDate)}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="rounded-md border border-white/30 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="rounded-lg overflow-hidden bg-black border border-white/10">
                <img
                  src={selectedPhoto.Photo_Link}
                  alt={`Customer upload ${selectedPhoto.ID}`}
                  className="w-full max-h-[80vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CasesPage;
