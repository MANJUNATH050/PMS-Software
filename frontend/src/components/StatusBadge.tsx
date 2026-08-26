import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status.toUpperCase()) {
      case 'PMS_STARTED':
      case 'SELF_ASSESSMENT_DRAFT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SELF_ASSESSMENT_SUBMITTED':
      case 'MANAGER_REVIEW_PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MANAGER_REVIEW_SUBMITTED':
      case 'HR_REVIEW_PENDING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'HR_REVIEW_COMPLETED':
      case 'RATING_AND_POINTS_CALCULATED':
      case 'FINAL_ANALYSIS':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'FINAL_RESULT_PUBLISHED':
      case 'COMPLETED':
        return 'bg-pms-lightGreen text-pms-darkGreen border-pms-green/30';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatStatus = () => {
    return status
      .replace('ROLE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles()}`}>
      {formatStatus()}
    </span>
  );
};
export default StatusBadge;
