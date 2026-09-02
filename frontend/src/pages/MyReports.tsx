import React, { useEffect, useState } from 'react';
import { pmsApi } from '../api/pmsApi';
import { reportApi } from '../api/reportApi';
import { employeeApi } from '../api/employeeApi';
import { PmsHistory, PmsAssignment, Employee } from '../types';
import { FileText, Download, Eye, AlertCircle, Calendar, User, CheckCircle2, Lock, X, MessageSquare, Award, Target, BarChart3, Briefcase, Mail, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RatingScaleLegend } from '../components/RatingScaleLegend';
import { KpiRatingChart, KpiChartItem } from '../components/KpiRatingChart';

export const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PmsHistory[]>([]);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track modal viewing state
  const [viewingAssignment, setViewingAssignment] = useState<PmsAssignment | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyList, empProfile] = await Promise.all([
        pmsApi.getHistory().catch(() => []),
        employeeApi.getProfile().catch(() => null)
      ]);
      // Sort newest cycle to oldest
      setReports(historyList);
      setProfile(empProfile);
    } catch (err: any) {
      console.error(err);
      setError('Unable to retrieve finalized performance reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: PmsHistory) => {
    const targetId = report.assignmentId || report.id;
    try {
      setLoadingDetailId(report.id);
      const detail = await pmsApi.getAssignmentDetail(targetId);
      setViewingAssignment(detail);
    } catch (err: any) {
      console.error('Failed to load report detail', err);
      // Fallback navigate to history detail page
      navigate(`/history/${targetId}`);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const triggerDownload = async (assignmentId: number, cycleMonth: string) => {
    setDownloading((prev) => ({ ...prev, [assignmentId]: true }));
    const filename = `PMS_Report_${cycleMonth.replace(/\s+/g, '_')}.pdf`;

    try {
      await reportApi.downloadReport(assignmentId, 'pdf', filename);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloading((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 h-40 skeleton-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Reports</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={() => loadReportsData()} className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Appraisal Reports Repository</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your finalized historical performance reports, review ratings/feedback, and download official PDF certifications.
        </p>
      </div>

      {/* Rating Scale Reference */}
      <RatingScaleLegend className="my-3" />

      {/* 1. EMPLOYEE REPORT HISTORY */}
      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No reports available</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Finalized monthly PMS appraisal reports will appear here for your review and PDF download.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <Calendar size={16} className="text-pms-green" />
            <span>My Appraisal Report History ({reports.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => {
              const targetId = report.assignmentId || report.id;
              const isDownloadingThis = downloading[targetId];
              const isLoadingThisDetail = loadingDetailId === report.id;

              return (
                <div
                  key={report.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-pms-lightGreen flex items-center justify-center text-pms-darkGreen shrink-0 font-bold shadow-inner">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-800">{report.cycleMonth} Appraisal</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Finalized on {report.finalizedDate || 'Completed'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Final Rating:</span>
                        <span className="font-black text-pms-darkGreen text-sm">
                          {report.finalScore != null ? report.finalScore.toFixed(2) : 'N/A'} / 5.0
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Performance:</span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                          {report.grade || 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleViewReport(report)}
                      disabled={isLoadingThisDetail}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                    >
                      <Eye size={15} />
                      <span>{isLoadingThisDetail ? 'Loading...' : 'View Report'}</span>
                    </button>

                    <button
                      onClick={() => triggerDownload(targetId, report.cycleMonth)}
                      disabled={isDownloadingThis}
                      className="px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Download size={15} className={isDownloadingThis ? 'animate-bounce' : ''} />
                      <span>{isDownloadingThis ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW REPORT MODAL */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-pms-darkGreen uppercase tracking-wider block">Official Performance Report</span>
                <h3 className="text-xl font-black text-slate-800">
                  {viewingAssignment.cycleMonth} PMS Appraisal Report
                </h3>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. EMPLOYEE DETAILS */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <User size={14} className="text-pms-green" />
                <span>Employee Details</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Employee Name</span>
                  <span className="font-bold text-slate-800">{viewingAssignment.employee?.name || profile?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Employee ID</span>
                  <span className="font-bold text-pms-darkGreen">
                    EMP-{viewingAssignment.employee?.id || profile?.id || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="font-bold text-slate-800 truncate block">{viewingAssignment.employee?.email || profile?.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Designation</span>
                  <span className="font-bold text-slate-800">{viewingAssignment.employee?.designation || profile?.designation || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="font-bold text-slate-800">{viewingAssignment.employee?.department || profile?.department || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reporting Manager</span>
                  <span className="font-bold text-slate-800">{viewingAssignment.employee?.managerName || profile?.managerName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Appraisal Cycle</span>
                  <span className="font-bold text-slate-800">{viewingAssignment.cycleMonth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">PMS Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] inline-block">
                    {viewingAssignment.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. OVERALL FINAL RATING */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Performance</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {viewingAssignment.performanceGrade || 'Completed'}
                </div>
              </div>
              <div className="text-center sm:text-right bg-white/10 px-6 py-4 rounded-xl backdrop-blur-xs">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Final Rating</span>
                <div className="text-3xl font-black text-white mt-0.5">
                  {viewingAssignment.overallScore != null ? viewingAssignment.overallScore.toFixed(2) : 'N/A'}
                  <span className="text-sm font-semibold text-slate-400"> / 5.00</span>
                </div>
              </div>
            </div>

            {/* 7. KPI GRAPHS */}
            {viewingAssignment.kpis && viewingAssignment.kpis.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <BarChart3 size={16} className="text-pms-green" />
                  <span>KPI Performance Graph</span>
                </h4>
                <KpiRatingChart
                  items={viewingAssignment.kpis.map((k) => ({
                    kpiName: k.kpiName,
                    weightage: k.weightage,
                    selfRating: k.selfRating,
                    managerRating: k.managerRating,
                    hrRating: k.hrRating
                  }))}
                  title="KPI Rating Comparison"
                />
              </div>
            )}

            {/* 3. KPI PERFORMANCE TABLE */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Target size={16} className="text-pms-green" />
                <span>KPI Performance Breakdown</span>
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">KPI Name</th>
                      <th className="py-3 px-3 text-center">Weight</th>
                      <th className="py-3 px-3 text-center">Self Rating</th>
                      <th className="py-3 px-3 text-center">Manager Rating</th>
                      <th className="py-3 px-3 text-center">HR Rating</th>
                      <th className="py-3 px-4">Comments & Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(viewingAssignment.kpis || []).map((kpi) => (
                      <tr key={kpi.kpiId} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {kpi.kpiName}
                          {kpi.description && <div className="text-[11px] font-normal text-slate-500 mt-0.5">{kpi.description}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold">{kpi.weightage}%</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded">
                            {kpi.selfRating != null ? `${kpi.selfRating} / 5` : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded">
                            {kpi.managerRating != null ? `${kpi.managerRating} / 5` : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 font-bold rounded">
                            {kpi.hrRating != null ? `${kpi.hrRating} / 5` : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          {kpi.comments || kpi.employeeComments || kpi.managerComments || kpi.hrComments ? (
                            <div className="space-y-1">
                              {kpi.employeeComments && <div><strong className="text-indigo-600">Self:</strong> {kpi.employeeComments}</div>}
                              {kpi.managerComments && <div><strong className="text-emerald-600">Manager:</strong> {kpi.managerComments}</div>}
                              {kpi.hrComments && <div><strong className="text-purple-600">HR:</strong> {kpi.hrComments}</div>}
                              {kpi.comments && <div><strong className="text-slate-700 font-bold">Comments:</strong> {kpi.comments}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No feedback provided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evaluator Comments */}
            {viewingAssignment.reviews && viewingAssignment.reviews.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <MessageSquare size={16} className="text-pms-green" />
                  <span>Evaluator Feedback & Comments</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingAssignment.reviews.map((rev, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rev.reviewerName}</span>
                        <span className="px-2 py-0.5 bg-pms-lightGreen text-pms-darkGreen font-bold rounded text-[10px]">
                          {rev.reviewerRole.replace('ROLE_', '')}
                        </span>
                      </div>
                      <p className="text-slate-600 italic">"{rev.comments}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => triggerDownload(viewingAssignment.assignmentId, viewingAssignment.cycleMonth)}
                className="px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Download size={14} />
                <span>Download PDF Report</span>
              </button>
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
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
export default MyReports;

