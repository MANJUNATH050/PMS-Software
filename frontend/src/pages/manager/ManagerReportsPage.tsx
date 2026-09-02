import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pmsApi } from '../../api/pmsApi';
import { reportApi } from '../../api/reportApi';
import { employeeApi } from '../../api/employeeApi';
import { PmsAssignment, PmsHistory, Employee, Kpi } from '../../types';
import { RatingScaleLegend } from '../../components/RatingScaleLegend';
import { KpiRatingChart, KpiChartItem } from '../../components/KpiRatingChart';
import {
  FileText,
  Clock,
  Lock,
  AlertCircle,
  Eye,
  Download,
  CheckCircle2,
  BarChart3,
  Award,
  Calendar,
  Target,
  User,
  X,
  MessageSquare,
  Building,
  Briefcase,
  Mail,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export const ManagerReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [history, setHistory] = useState<PmsHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Read-only modal for full history or current report detail
  const [viewingAssignment, setViewingAssignment] = useState<PmsAssignment | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    loadManagerReportData();
  }, []);

  const loadManagerReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empProfile, currAssignment, historyList] = await Promise.all([
        employeeApi.getProfile().catch(() => null),
        pmsApi.getCurrentAssignment().catch(() => null),
        pmsApi.getHistory().catch(() => [])
      ]);
      setProfile(empProfile);
      setAssignment(currAssignment);
      setHistory(historyList);
    } catch (err: any) {
      console.error('Failed to load manager report data', err);
      setError('Unable to load your manager performance reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistoryDetail = async (item: PmsHistory) => {
    const targetId = item.assignmentId || item.id;
    try {
      setLoadingDetailId(item.id);
      const detail = await pmsApi.getAssignmentDetail(targetId);
      setViewingAssignment(detail);
    } catch (err: any) {
      console.error('Failed to load historical report detail', err);
      alert('Unable to load report details.');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleDownloadPdf = async (assignmentId: number, cycleMonth: string) => {
    const filename = `Manager_PMS_Report_${cycleMonth.replace(/\s+/g, '_')}.pdf`;
    try {
      setDownloadingId(assignmentId);
      await reportApi.downloadReport(assignmentId, 'pdf', filename);
    } catch (err: any) {
      console.error('Failed to download PDF report', err);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Manager Reports...</p>
        </div>
      </div>
    );
  }

  const kpis = assignment?.kpis || [];
  const kpiChartItems: KpiChartItem[] = kpis.map((k) => ({
    kpiName: k.kpiName,
    weightage: k.weightage,
    selfRating: k.selfRating,
    managerRating: k.managerRating,
    hrRating: k.hrRating
  }));

  const isFinalized =
    assignment?.status === 'COMPLETED' || assignment?.status === 'FINAL_RESULT_PUBLISHED';

  const managerName = profile?.name || assignment?.employee?.name || user?.fullName || 'Manager';
  const managerEmpId = user?.employeeCode || (profile?.id ? `EMP-${profile.id}` : (assignment?.employee?.id ? `EMP-${assignment.employee.id}` : '-'));
  const managerEmail = profile?.email || assignment?.employee?.email || user?.email || '-';
  const managerDesignation = profile?.designation || assignment?.employee?.designation || '-';
  const managerDepartment = profile?.department || assignment?.employee?.department || '-';
  const managerReporting = profile?.managerName || assignment?.employee?.managerName || '-';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
            <BarChart3 size={16} />
            <span>Manager Portal • My Reports</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Manager Reports</h1>
          <p className="text-slate-500 text-sm mt-1">
            My personal performance reports, KPI performance, evaluation graphs, and appraisal history.
          </p>
        </div>
        {assignment && (
          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <Calendar className="text-purple-600 shrink-0" size={20} />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Cycle</div>
              <div className="text-sm font-black text-slate-800">{assignment.cycleMonth}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-medium">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. MANAGER DETAILS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">1. Manager Details</h2>
            <p className="text-xs text-slate-500">Authenticated manager profile & appraisal status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase mb-1">
              <User size={14} className="text-purple-600" />
              <span>Manager Name</span>
            </div>
            <div className="text-base font-black text-slate-800">{managerName}</div>
            <div className="text-xs font-semibold text-purple-600 mt-0.5">{managerEmpId}</div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase mb-1">
              <Mail size={14} className="text-blue-600" />
              <span>Email Address</span>
            </div>
            <div className="text-sm font-bold text-slate-800 truncate" title={managerEmail}>{managerEmail}</div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase mb-1">
              <Briefcase size={14} className="text-emerald-600" />
              <span>Designation & Department</span>
            </div>
            <div className="text-sm font-bold text-slate-800">{managerDesignation}</div>
            <div className="text-xs font-medium text-slate-500">{managerDepartment}</div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase mb-1">
              <UserCheck size={14} className="text-amber-600" />
              <span>Reporting Manager</span>
            </div>
            <div className="text-sm font-bold text-slate-800">{managerReporting}</div>
          </div>
        </div>

        {assignment && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              <span>Appraisal Cycle: <strong className="text-slate-800 font-bold">{assignment.cycleMonth}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">PMS Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                isFinalized
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isFinalized ? <Lock size={12} /> : <Clock size={12} />}
                <span>{assignment.status.replace(/_/g, ' ')}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MY MANAGER KPIs */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-pms-darkGreen flex items-center justify-center font-bold">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">2. My Manager KPIs</h2>
              <p className="text-xs text-slate-500">Your assigned key performance indicators, weightages, and ratings</p>
            </div>
          </div>
          {assignment?.overallScore != null && (
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase block">Overall KPI Score</span>
              <span className="text-2xl font-black text-pms-darkGreen">
                {assignment.overallScore.toFixed(2)} <span className="text-sm text-slate-400 font-medium">/ 5.0</span>
              </span>
            </div>
          )}
        </div>

        {/* KPI Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">KPI & Description</th>
                <th className="py-3.5 px-4 text-center">Weightage</th>
                <th className="py-3.5 px-4 text-center">Self Rating</th>
                <th className="py-3.5 px-4 text-center">Manager Rating</th>
                <th className="py-3.5 px-4 text-center">HR Rating</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5">Comments / Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No KPI performance data available for the current cycle.
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => (
                  <tr key={kpi.kpiId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{kpi.kpiName}</div>
                      {kpi.description && (
                        <div className="text-xs text-slate-500 mt-0.5">{kpi.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {kpi.weightage}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs">
                        {kpi.selfRating !== null ? `${kpi.selfRating} / 5` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">
                        {kpi.managerRating !== null ? `${kpi.managerRating} / 5` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg text-xs">
                        {kpi.hrRating !== null ? `${kpi.hrRating} / 5` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-md">
                        {kpi.ratingStatus || 'SUBMITTED'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-600">
                      {kpi.comments || kpi.employeeComments || kpi.managerComments || kpi.hrComments ? (
                        <div className="space-y-1">
                          {kpi.comments && <div><span className="font-bold text-slate-700">Comments:</span> {kpi.comments}</div>}
                          {kpi.employeeComments && <div><span className="font-bold text-indigo-600">Self:</span> {kpi.employeeComments}</div>}
                          {kpi.managerComments && <div><span className="font-bold text-emerald-600">Manager:</span> {kpi.managerComments}</div>}
                          {kpi.hrComments && <div><span className="font-bold text-purple-600">HR:</span> {kpi.hrComments}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No feedback provided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. KPI GRAPHS */}
      {kpis.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">3. KPI Graphs</h2>
              <p className="text-xs text-slate-500">Visual performance graph for your own assigned KPIs</p>
            </div>
          </div>

          <KpiRatingChart items={kpiChartItems} title="My KPI Performance Graph" />
        </div>
      )}

      {/* 4. MY MANAGER REPORT */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">4. My Manager Report</h2>
              <p className="text-xs text-slate-500">Active PMS evaluation report and overall result summary</p>
            </div>
          </div>
          {assignment && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewingAssignment(assignment)}
                className="px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1"
              >
                <Eye size={14} />
                <span>View Full Report</span>
              </button>
              <button
                onClick={() => handleDownloadPdf(assignment.assignmentId, assignment.cycleMonth)}
                disabled={downloadingId === assignment.assignmentId}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-slate-200"
              >
                <Download size={14} />
                <span>{downloadingId === assignment.assignmentId ? '...' : 'PDF'}</span>
              </button>
            </div>
          )}
        </div>

        {assignment ? (
          <div className="space-y-6">
            {/* Score & Category Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Performance Category</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {assignment.performanceGrade || 'Pending Finalization'}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Appraisal Cycle: <span className="font-semibold text-white">{assignment.cycleMonth}</span>
                </div>
              </div>
              <div className="text-center sm:text-right bg-white/10 px-6 py-4 rounded-xl backdrop-blur-xs">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Overall Rating</span>
                <div className="text-3xl font-black text-white mt-0.5">
                  {assignment.overallScore != null ? assignment.overallScore.toFixed(2) : 'N/A'}
                  <span className="text-sm font-semibold text-slate-400"> / 5.00</span>
                </div>
              </div>
            </div>

            {/* Evaluator Reviews / Remarks */}
            {assignment.reviews && assignment.reviews.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <MessageSquare size={16} className="text-purple-600" />
                  <span>Evaluator Feedback & Comments</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.reviews.map((rev, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{rev.reviewerName}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-md text-[10px]">
                          {rev.reviewerRole.replace('ROLE_', '')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{rev.comments}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating Scale Legend */}
            <RatingScaleLegend />
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            <FileText size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">No active PMS appraisal report found.</p>
          </div>
        )}
      </div>

      {/* 5. MANAGER REPORT HISTORY */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">5. Manager Report History</h2>
              <p className="text-xs text-slate-500">Access previous finalized PMS appraisal cycle reports and PDF certificates</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Cycle</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">Overall Rating</th>
                <th className="py-3.5 px-5 text-center">Performance Category</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <Clock size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No historical appraisal records available.</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{item.cycleMonth}</div>
                      <div className="text-xs text-slate-400">{item.finalizedDate || 'Finalized'}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Completed</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="font-black text-pms-darkGreen text-base">
                        {item.finalScore != null ? item.finalScore.toFixed(2) : 'N/A'} / 5.0
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-xs font-bold text-slate-700">{item.grade || 'Finalized'}</span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewHistoryDetail(item)}
                          disabled={loadingDetailId === item.id}
                          className="px-3.5 py-1.5 bg-pms-lightGreen text-pms-darkGreen hover:bg-pms-green hover:text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1"
                        >
                          <Eye size={14} />
                          <span>{loadingDetailId === item.id ? 'Loading...' : 'View Report'}</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(item.assignmentId || item.id, item.cycleMonth)}
                          disabled={downloadingId === (item.assignmentId || item.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-slate-200"
                        >
                          <Download size={14} />
                          <span>{downloadingId === (item.assignmentId || item.id) ? '...' : 'PDF'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Report Detail Modal (Read-Only) */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Historical Report View</span>
                <h3 className="text-xl font-black text-slate-800">
                  Manager Report — {viewingAssignment.cycleMonth}
                </h3>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Score Summary */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Overall Performance Result</span>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {viewingAssignment.performanceGrade || 'Finalized'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">
                  {viewingAssignment.overallScore != null ? viewingAssignment.overallScore.toFixed(2) : 'N/A'} / 5.0
                </span>
              </div>
            </div>

            {/* Modal KPI Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800">KPI Performance Breakdown</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase">
                    <tr className="border-b border-slate-200">
                      <th className="py-2.5 px-4">KPI Name</th>
                      <th className="py-2.5 px-3 text-center">Weight</th>
                      <th className="py-2.5 px-3 text-center">Self</th>
                      <th className="py-2.5 px-3 text-center">Manager</th>
                      <th className="py-2.5 px-3 text-center">HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(viewingAssignment.kpis || []).map((k) => (
                      <tr key={k.kpiId}>
                        <td className="py-2.5 px-4 font-semibold">{k.kpiName}</td>
                        <td className="py-2.5 px-3 text-center">{k.weightage}%</td>
                        <td className="py-2.5 px-3 text-center">{k.selfRating ?? '-'}</td>
                        <td className="py-2.5 px-3 text-center">{k.managerRating ?? '-'}</td>
                        <td className="py-2.5 px-3 text-center">{k.hrRating ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Evaluator Reviews */}
            {viewingAssignment.reviews && viewingAssignment.reviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800">Evaluator Comments</h4>
                <div className="space-y-2">
                  {viewingAssignment.reviews.map((r, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800">{r.reviewerName} ({r.reviewerRole}): </span>
                      <span className="text-slate-600 italic">"{r.comments}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleDownloadPdf(viewingAssignment.assignmentId, viewingAssignment.cycleMonth)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Download size={14} />
                <span>Download PDF Report</span>
              </button>
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReportsPage;
