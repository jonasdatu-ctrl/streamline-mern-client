import React from "react";
import { getCaseDetailRoute } from "../../config/constants";

const CaseIdLink = ({ caseId, className = "", children }) => {
  const normalizedCaseId = String(caseId || "").trim();
  const content = children || normalizedCaseId || "-";

  if (!normalizedCaseId) {
    return <span className={className}>{content}</span>;
  }

  return (
    <a
      href={getCaseDetailRoute(normalizedCaseId)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  );
};

export default CaseIdLink;
