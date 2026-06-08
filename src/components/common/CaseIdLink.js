import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/constants";

const CaseIdLink = ({ caseId, className = "" }) => {
  const navigate = useNavigate();
  const normalizedCaseId = String(caseId || "").trim();

  if (!normalizedCaseId) {
    return <span className={className}>-</span>;
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`${ROUTES.CASES}/${normalizedCaseId}`)}
      className={`underline text-blue-700 hover:text-blue-900 ${className}`.trim()}
    >
      {normalizedCaseId}
    </button>
  );
};

CaseIdLink.propTypes = {
  caseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default CaseIdLink;
