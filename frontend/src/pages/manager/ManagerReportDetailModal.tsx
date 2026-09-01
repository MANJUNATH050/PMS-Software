import React, { useEffect, useState } from 'react';
import { managerApi } from '../../api/managerApi';
import { KpiRatingChart } from '../../components/KpiRatingChart';
import {
  FileText,
  Download,
  X,
  User,
  Building2,
  Calendar,
  Briefcase,
  ShieldCheck,
  Award,
  Lock,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';

interface ManagerReportDetailModalProps {
  employeeId: number | null;
  onClose: () => void;
}

export const ManagerReportDetailModal: React.FC<ManagerReportDetailModalProps> = ({
  employeeId,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (employeeId) {
      fetchReportDetail(employeeId);
    }
  }, [employeeId]);

  const fetchReportDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await managerApi.getEmployeeFullReport(id);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch full employee report detail', err);
      setError('Unable to load performance report detail for this employee.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!data || !data.assignmentId) return;
    try {
      setDownloading(true);
      await managerApi.downloadManagerReport(
        data.assignmentId,
        data.employee?.name || 'Employee',
        format
      );
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download report document.');
    } finally {
      setDownloading(false);
    }
  };

  const deriveGrade = (score: number | null) => {
    if (!score) return 'Pending HR Finalization';
    if (score >= 4.5) return 'OUTSTANDING PERFORMANCE';
    if (score >= 4.0) return 'EXCELLENT PERFORMANCE';
    if (score >= 3.5) return 'VERY GOOD PERFORMANCE';
    if (score >= 3.0) return 'GOOD PERFORMANCE';
    if (score >= 2.0) return 'NEEDS IMPROVEMENT';
    return 'UNSATISFACTORY';
  };

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-pms-lightGreen text-pms-darkGreen rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                Official Employee Performance Report
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive Read-Only Performance Document & Audit Trail
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {data && data.assignmentId && (
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Download size={14} />
                <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-pms-green border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-500">Loading appraisal report details...</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center space-x-3 text-sm">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <span>{error || 'No report details available.'}</span>
            </div>
          ) : (
            <>
              {/* A. Employee Information Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-pms-green text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                      {data.employee?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-black text-slate-800">{data.employee?.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {data.employee?.employeeCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {data.employee?.designation} • {data.employee?.department} ({data.employee?.team})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold ${
                        data.status === 'COMPLETED' || data.status === 'FINAL_RESULT_PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {data.status === 'COMPLETED' || data.status === 'FINAL_RESULT_PUBLISHED' ? (
                        <Lock size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                      <span>{data.status?.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Appraisal Cycle</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{data.cycleMonth || 'August 2026'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Reporting Manager</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{data.employee?.managerName || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Start Date</span>
                    <span className="font-bold text-slate-600 mt-0.5 block">{data.startDate || '2026-08-01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">End Date</span>
                    <span className="font-bold text-slate-600 mt-0.5 block">{data.endDate || '2026-08-31'}</span>
                  </div>
                </div>
              </div>

              {/* B. Performance Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Performance Evaluation Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Self Rating</span>
                    <span className="text-lg font-black text-slate-700 mt-1 block">
                      {data.selfCalculatedScore != null ? data.selfCalculatedScore.toFixed(2) : 'N/A'}{' '}
                      <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Employee Input</span>
                  </div>

                  <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Manager Rating</span>
                    <span className="text-lg font-black text-purple-900 mt-1 block">
                      {data.managerCalculatedScore != null ? data.managerCalculatedScore.toFixed(2) : 'N/A'}{' '}
                      <span className="text-xs text-purple-400 font-normal">/ 5.0</span>
                    </span>
                    <span className="text-[9px] text-purple-600 font-semibold mt-0.5 block">Role KPIs Score</span>
                  </div>

                  <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">HR Rating</span>
                    <span className="text-lg font-black text-blue-900 mt-1 block">
                      {data.hrCalculatedScore != null ? data.hrCalculatedScore.toFixed(2) : 'N/A'}{' '}
                      <span className="text-xs text-blue-400 font-normal">/ 5.0</span>
                    </span>
                    <span className="text-[9px] text-blue-600 font-semibold mt-0.5 block">HR Review KPIs</span>
                  </div>

                  <div className="p-3.5 bg-pms-lightGreen/50 rounded-xl border border-pms-green/40 shadow-2xs">
                    <span className="text-[10px] font-bold text-pms-darkGreen uppercase tracking-wider block">Final Rating</span>
                    <span className="text-lg font-black text-pms-darkGreen mt-1 block">
                      {data.overallScore != null ? data.overallScore.toFixed(2) : 'Pending'}{' '}
                      <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
                    </span>
                    <span className="text-[9px] text-pms-darkGreen font-extrabold mt-0.5 block">
                      {data.performanceGrade || deriveGrade(data.overallScore)}
                    </span>
                  </div>
                </div>
              </div>

              {/* D. Performance Comparison Graph */}
              {data.roleKpis && data.roleKpis.length > 0 && (
                <KpiRatingChart
                  title={`KPI Performance Ratings Comparison — ${data.employee?.name}`}
                  items={[
                    ...data.roleKpis.map((k: any) => ({
                      kpiName: k.kpiName,
                      weightage: k.weightage,
                      selfRating: k.selfRating,
                      managerRating: k.managerRating,
                      hrRating: k.hrRating
                    })),
                    ...(data.hrKpis || []).map((k: any) => ({
                      kpiName: `[HR] ${k.kpiName}`,
                      weightage: k.weightage,
                      selfRating: null,
                      managerRating: null,
                      hrRating: k.hrRating
                    }))
                  ]}
                />
              )}

              {/* C. Role / Manager KPI Breakdown (READ ONLY) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
                  <Briefcase size={18} className="text-purple-600" />
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Role & Operational KPIs Breakdown (Read-Only)
                  </h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {(data.roleKpis || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No Role KPIs assigned.</div>
                  ) : (
                    data.roleKpis.map((kpi: any, idx: number) => (
                      <div key={kpi.kpiId || idx} className="p-5 space-y-3 hover:bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-black text-slate-800">{kpi.kpiName}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.description}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-slate-100 text-pms-darkGreen font-extrabold text-xs rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
                            Weight: {kpi.weightage}%
                          </span>
                        </div>

                        {/* Rating Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Self Rating</span>
                            <span className="font-extrabold text-emerald-900 mt-0.5 block">
                              {kpi.selfRating != null ? `${kpi.selfRating} / 5.0` : 'Not Rated'}
                            </span>
                            <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200">
                              "{kpi.employeeComments || 'No comment provided.'}"
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-purple-700 uppercase block">Manager Rating</span>
                            <span className="font-extrabold text-purple-900 mt-0.5 block">
                              {kpi.managerRating != null ? `${kpi.managerRating} / 5.0` : 'Not Rated'}
                            </span>
                            <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200">
                              "{kpi.managerComments || 'No comment provided.'}"
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase block">HR Rating</span>
                            <span className="font-extrabold text-blue-900 mt-0.5 block">
                              {kpi.hrRating != null ? `${kpi.hrRating} / 5.0` : 'Not Rated'}
                            </span>
                            <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200">
                              "{kpi.hrComments || 'No comment provided.'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* D. HR Review KPIs Section */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    HR Review KPIs Evaluation (Corporate Standard)
                  </h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {(data.hrKpis || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No HR Review KPIs recorded.</div>
                  ) : (
                    data.hrKpis.map((kpi: any, idx: number) => (
                      <div key={kpi.kpiId || idx} className="p-5 space-y-3 hover:bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-black text-slate-800">{kpi.kpiName}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.description}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-extrabold text-xs rounded-lg border border-blue-200 self-start sm:self-auto shrink-0">
                            Weight: {kpi.weightage}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/40 p-3 rounded-xl border border-blue-150 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase block">HR Rating</span>
                            <span className="font-extrabold text-blue-900 mt-0.5 block">
                              {kpi.hrRating != null ? `${kpi.hrRating} / 5.0` : 'Pending HR Rating'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase block">HR Feedback</span>
                            <p className="text-[11px] text-slate-700 italic mt-1 bg-white p-2 rounded-lg border border-blue-200">
                              "{kpi.hrComments || 'No comment provided.'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* E & F. Comments Summary Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Overall Qualitative Feedback
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1">
                    <span className="font-bold text-purple-800 uppercase tracking-wider text-[10px] block">
                      Reporting Manager Overall Comments
                    </span>
                    <p className="text-slate-700 italic leading-relaxed">
                      "{data.overallManagerComment || 'No comment provided.'}"
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                    <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px] block">
                      HR Administration Final Comments
                    </span>
                    <p className="text-slate-700 italic leading-relaxed">
                      "{data.overallHrComment || 'No comment provided.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* G. Final Result Section */}
              <div className="bg-pms-lightGreen/40 p-6 rounded-2xl border border-pms-green/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold text-pms-darkGreen uppercase tracking-wider block">
                    Final Performance Appraisal Result
                  </span>
                  <div className="text-2xl font-black text-pms-darkGreen mt-1">
                    {data.overallScore != null ? `${data.overallScore.toFixed(2)} / 5.00` : 'Pending Final Score'}
                  </div>
                  <span className="text-xs font-extrabold text-pms-darkGreen block mt-0.5">
                    Category: {data.performanceGrade || deriveGrade(data.overallScore)}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={downloading}
                    className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-2"
                  >
                    <Download size={15} />
                    <span>Download Official PDF Report</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
