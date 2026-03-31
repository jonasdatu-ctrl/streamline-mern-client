import React from "react";
import { useParams } from "react-router-dom";

const CaseDetails = () => {
  const { caseId } = useParams();
  return <div>{caseId}</div>;
};

export default CaseDetails;