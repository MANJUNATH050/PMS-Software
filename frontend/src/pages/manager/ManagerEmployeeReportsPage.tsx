import React, { useEffect, useState } from 'react';
import { managerApi } from '../../api/managerApi';
import { ManagerReportData, ManagerEmployeeItem } from '../../types';
import { ManagerReportDetailModal } from './ManagerReportDetailModal';
import {
  ClipboardList,
  Filter,
  Clock,
  Lock,
  AlertCircle,
  Search,
  Eye,
  Download,
  Users,
  Award
} from 'lucide-react';

export const ManagerEmployeeReportsPage: React.FC = () => {
  const [reportsData, setReportsData] = useState<ManagerReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployeeIdFilter, setSelectedEmployeeIdFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected employee for viewing detailed report modal
  const [viewingEmployeeId, setViewingEmployeeId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await managerApi.getReports();
      setReportsData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load employee reports', err);
      setError('Unable to load assigned employee performance reports.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = (reportsData?.assignedEmployees || []).filter((emp) => {
    if (selectedStatus === 'FINALIZED') {
      const isFinalized = emp.status === 'COMPLETED' || emp.status === 'FINAL_RESULT_PUBLISHED';
      if (!isFinalized) return false;
    } else if (selectedStatus !== 'ALL') {
      if (emp.status !== selectedStatus) return false;
    }

    if (selectedEmployeeIdFilter !== 'ALL' && emp.id.toString() !== selectedEmployeeIdFilter) return false;
    if (selectedMonth !== 'ALL' && emp.cycleMonth !== selectedMonth) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueMonths = Array.from(
    new Set((reportsData?.assignedEmployees || []).map((e) => e.cycleMonth || 'August 2026'))
  );

  const handleDownloadPdf = async (emp: ManagerEmployeeItem) => {
    if (!emp.assignmentId) {
      alert('No appraisal cycle assignment found for this employee.');
      return;
    }
    try {
      setDownloadingId(emp.id);
      await managerApi.downloadManagerReport(emp.assignmentId, emp.name, 'pdf');
    } catch (err: any) {
      console.error('Failed to download PDF report', err);
      alert('Failed to download PDF report.');
    } finally {
      setDownloadingId(null);
    }
  };

  const deriveCategory = (score: number | null, grade: string | null) => {
    if (grade) return grade;
    if (!score) return 'Pending Finalization';
    if (score >= 4.5) return 'Outstanding Performance';
    if (score >= 4.0) return 'Excellent Performance';
    if (score >= 3.5) return 'Very Good Performance';
    if (score >= 3.0) return 'Good Performance';
    if (score >= 2.0) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Assigned Employee Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <ClipboardList size={16} />
            <span>Manager Portal • Direct Reports Performance Documents</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Employee Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            View detailed performance evaluations and download official PDF reports for your assigned team members.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-medium">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
          <Filter size={18} className="text-slate-400" />
          <span>Filter Assigned Employee Reports</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employee Filter */}
          <div>
            <label htmlFor="emp-report-filter-employee" className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Employee</label>
            <select
              id="emp-report-filter-employee"
              name="filterEmployee"
              value={selectedEmployeeIdFilter}
              onChange={(e) => setSelectedEmployeeIdFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All Direct Reports ({reportsData?.assignedEmployees.length})</option>
              {reportsData?.assignedEmployees.map((e) => (
                <option key={e.id} value={e.id.toString()}>
                  {e.name} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label htmlFor="emp-report-filter-month" className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Appraisal Cycle</label>
            <select
              id="emp-report-filter-month"
              name="filterMonth"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All Cycles</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="emp-report-filter-status" className="text-xs font-bold text-slate-500 uppercase block mb-1.5">PMS Status</label>
            <select
              id="emp-report-filter-status"
              name="filterStatus"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
            >
              <option value="ALL">All PMS Statuses</option>
              <option value="FINALIZED">Finalized / Published Records Only</option>
              <option value="SELF_ASSESSMENT_SUBMITTED">Self-Assessment Submitted</option>
              <option value="MANAGER_REVIEW_PENDING">Manager Review Pending</option>
              <option value="MANAGER_REVIEW_SUBMITTED">Manager Review Submitted</option>
              <option value="HR_REVIEW_PENDING">HR Review Pending</option>
              <option value="SELF_ASSESSMENT_DRAFT">Self-Assessment Draft</option>
              <option value="PMS_NOT_STARTED">Not Started</option>
            </select>
          </div>

          {/* Text Search */}
          <div>
            <label htmlFor="emp-report-search-query" className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Search</label>
            <div className="relative">
              <input
                id="emp-report-search-query"
                name="searchQuery"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pms-green focus:bg-white"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Reports List / Cards & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Employee Name & ID</th>
                <th className="py-4 px-6">Designation & Department</th>
                <th className="py-4 px-6">Appraisal Cycle</th>
                <th className="py-4 px-6">PMS Status</th>
                <th className="py-4 px-6 text-center">Final Score</th>
                <th className="py-4 px-6 text-center">Performance Category</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold">No assigned employee reports match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isFinalized = emp.status === 'COMPLETED' || emp.status === 'FINAL_RESULT_PUBLISHED';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400">
                          {emp.employeeCode} • {emp.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        <div>{emp.designation}</div>
                        <div className="text-xs text-slate-400">{emp.department}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {emp.cycleMonth || 'August 2026'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isFinalized
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : emp.status === 'MANAGER_REVIEW_SUBMITTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isFinalized ? <Lock size={12} /> : <Clock size={12} />}
                          <span>{emp.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-black text-pms-darkGreen">
                        {emp.overallScore != null ? `${emp.overallScore.toFixed(2)} / 5.0` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-extrabold text-slate-700">
                        {deriveCategory(emp.overallScore, emp.performanceGrade)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setViewingEmployeeId(emp.id)}
                            className="px-3.5 py-1.5 bg-pms-lightGreen text-pms-darkGreen hover:bg-pms-green hover:text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1"
                          >
                            <Eye size={14} />
                            <span>View Report</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(emp)}
                            disabled={downloadingId === emp.id}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-slate-200"
                            title="Download PDF"
                          >
                            <Download size={14} />
                            <span>{downloadingId === emp.id ? '...' : 'PDF'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detailed Report Modal */}
      {viewingEmployeeId && (
        <ManagerReportDetailModal
          employeeId={viewingEmployeeId}
          onClose={() => setViewingEmployeeId(null)}
        />
      )}
    </div>
  );
};

export default ManagerEmployeeReportsPage;
