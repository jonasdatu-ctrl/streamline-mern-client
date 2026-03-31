import React from "react";
import { Link } from "react-router-dom";
import { getCaseDetailRoute } from "../../config/constants";

const CaseIdLink = ({ caseId, className = "", children }) => {
  const normalizedCaseId = String(caseId || "").trim();
  const content = children || normalizedCaseId || "-";

  if (!normalizedCaseId) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link to={getCaseDetailRoute(normalizedCaseId)} className={className}>
      {content}
    </Link>
  );
};

export default CaseIdLink;