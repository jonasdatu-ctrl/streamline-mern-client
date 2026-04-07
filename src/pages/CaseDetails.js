import React from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";

const CaseDetails = () => {
  const { caseId } = useParams();

  return (
    <Layout showLogout={true} title="Case Details">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Case ID
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{caseId}</h1>
          <p className="mt-4 text-gray-600">
            Case-specific content can be added here next.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CaseDetails;