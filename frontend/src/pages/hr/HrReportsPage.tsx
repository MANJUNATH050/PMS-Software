import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Employee, HrReportSummary, EmployeeLifecycleData } from '../../types';
import { KpiRatingChart } from '../../components/KpiRatingChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  FileText,
  Download,
  ArrowLeft,
  Filter,
  BarChart3,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Building2
} from 'lucide-react';

export const HrReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [cycleMonth, setCycleMonth] = useState('August 2026');
  const [reportType, setReportType] = useState('Detailed Performance Report');

  const [summary, setSummary] = useState<HrReportSummary | null>(null);
  const [lifecycle, setLifecycle] = useState<EmployeeLifecycleData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load: summary and employee list
    Promise.all([
      hrApi.getReportsSummary(),
      hrApi.searchLifecycleEmployees()
    ])
      .then(([sumData, empList]) => {
        setSummary(sumData);
        setEmployees(empList);
        if (empList.length > 0) {
          const firstEmpId = empList[0].id;
          setSelectedEmployeeId(firstEmpId);
          fetchEmployeeReport(firstEmpId, 'August 2026');
        }
        setLoadingSummary(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load reporting data.');
        setLoadingSummary(false);
      });
  }, []);

  const fetchEmployeeReport = (empId: number, cycle: string) => {
    setLoadingReport(true);
    setLifecycle(null);
    hrApi.getLifecycleDetail(empId, cycle)
      .then((data) => {
        setLifecycle(data);
        setLoadingReport(false);
      })
      .catch((err) => {
        console.error(err);
        setLifecycle(null);
        setLoadingReport(false);
      });
  };

  const handleEmployeeChange = (empId: number) => {
    setSelectedEmployeeId(empId);
    if (empId) {
      fetchEmployeeReport(empId, cycleMonth);
    }
  };

  const handleCycleChange = (selectedCycle: string) => {
    setCycleMonth(selectedCycle);
    if (selectedEmployeeId) {
      fetchEmployeeReport(Number(selectedEmployeeId), selectedCycle);
    }
  };

  const handleReportTypeChange = (selectedType: string) => {
    setReportType(selectedType);
  };

  const handleDownload = async (format: 'pdf' | 'excel') => {
    if (!lifecycle || !lifecycle.assignmentId) {
      alert('No appraisal assignment record available for the selected employee and cycle.');
      return;
    }

    setDownloading(true);
    try {
      const responseBlob = await hrApi.downloadReport(lifecycle.assignmentId, format);
      const blob = responseBlob instanceof Blob ? responseBlob : new Blob([responseBlob], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const empNameClean = (lifecycle.employee?.name || 'Employee').replace(/\s+/g, '_');
      const cycleClean = cycleMonth.replace(/\s+/g, '_');
      a.download = `PMS_Report_${empNameClean}_${cycleClean}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const deriveGrade = (score: number) => {
    if (score >= 4.5) return 'OUTSTANDING PERFORMANCE';
    if (score >= 4.0) return 'EXCELLENT PERFORMANCE';
    if (score >= 3.5) return 'VERY GOOD PERFORMANCE';
    if (score >= 3.0) return 'GOOD PERFORMANCE';
    if (score >= 2.0) return 'NEEDS IMPROVEMENT';
    return 'UNSATISFACTORY';
  };

  const roleKpis = lifecycle?.kpis ? lifecycle.kpis.filter(k => k.kpiCategory !== 'HR_REVIEW_KPI') : (lifecycle?.roleKpis || []);
  const hrReviewKpis = lifecycle?.kpis ? lifecycle.kpis.filter(k => k.kpiCategory === 'HR_REVIEW_KPI') : (lifecycle?.hrReviewKpis || []);

  const selectedEmployeeObj = employees.find(e => e.id === Number(selectedEmployeeId));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-pms-gray mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-2xl font-bold text-pms-gray">Corporate Performance Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic ratings distribution analytics and official performance document exports.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Rating Category Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-pms-gray">HR Rating Category Summary</h3>
              <p className="text-xs text-slate-500">Distribution of finalized employee appraisals across corporate rating categories</p>
            </div>
          </div>
          {summary && summary.totalFinalizedRecords > 0 && (
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Total Published</span>
              <span className="text-lg font-extrabold text-pms-darkGreen">{summary.totalFinalizedRecords} Employees</span>
            </div>
          )}
        </div>

        {loadingSummary ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading rating distribution...</div>
        ) : !summary || summary.totalFinalizedRecords === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No finalized PMS results available yet. Results will appear dynamically when appraisals are completed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Rating Category</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-center">Score Range</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-center">Employee Count</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase text-right">Percentage</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Distribution Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.categories.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-xs font-bold text-pms-gray">{cat.category}</td>
                    <td className="px-5 py-3.5 text-xs text-center text-slate-500 font-medium">
                      {cat.category === 'Excellent' ? '≥ 4.20' : cat.category === 'Very Good' ? '3.80 - 4.19' : cat.category === 'Good' ? '3.00 - 3.79' : cat.category === 'Needs Improvement' ? '2.00 - 2.99' : '< 2.00'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-slate-700 text-center">
                      {cat.count}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-pms-darkGreen text-right">
                      {cat.percentage}%
                    </td>
                    <td className="px-5 py-3.5 w-1/3">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                          className="bg-pms-green h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Dynamic Report Generation & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-pms-lightGreen text-pms-darkGreen rounded-xl">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-pms-gray">Generate Individual Appraisal Reports</h3>
            <p className="text-xs text-slate-500">Select employee, appraisal cycle month, and report format type to dynamically generate preview and export</p>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Employee Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Employee:
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(Number(e.target.value))}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 bg-slate-50/50"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (EMP-{emp.id}) - {emp.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Month / Cycle Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Appraisal Cycle Month:
            </label>
            <select
              value={cycleMonth}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 bg-slate-50/50"
            >
              <option value="August 2026">August 2026 (Active Cycle)</option>
              <option value="July 2026">July 2026 (Finalized)</option>
              <option value="June 2026">June 2026 (Finalized)</option>
              <option value="May 2026">May 2026 (Finalized)</option>
            </select>
          </div>

          {/* Report Type Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Report Format Type:
            </label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 bg-slate-50/50"
            >
              <option value="Detailed Performance Report">Detailed Performance Report</option>
              <option value="KPI Weightage Breakdown">KPI Weightage Breakdown</option>
              <option value="Manager & HR Review Sheet">Manager & HR Review Sheet</option>
            </select>
          </div>
        </div>

        {/* Report Target & Action Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-pms-gray">
              Report Target: <span className="text-pms-darkGreen font-extrabold">{selectedEmployeeObj?.name || 'Selected Employee'}</span> • {cycleMonth} • {reportType}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Status: <strong className="text-slate-700">{lifecycle?.status?.replace(/_/g, ' ') || 'ACTIVE'}</strong> • {lifecycle?.kpis?.length || 0} Assigned KPIs
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={downloading || !lifecycle || !lifecycle.hasActiveAssignment}
              onClick={() => handleDownload('pdf')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Download size={15} />
              <span>Export PDF Report</span>
            </button>
            <button
              type="button"
              disabled={downloading || !lifecycle || !lifecycle.hasActiveAssignment}
              onClick={() => handleDownload('excel')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <FileSpreadsheet size={15} />
              <span>Export Excel Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Report Preview Container */}
      {loadingReport ? (
        <div className="p-12 text-center text-xs font-bold text-slate-500 bg-white rounded-2xl border border-slate-200/70 shadow-sm space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-pms-green border-t-transparent rounded-full mx-auto"></div>
          <p>Loading appraisal report for {selectedEmployeeObj?.name || 'employee'} ({cycleMonth})...</p>
        </div>
      ) : !lifecycle || !lifecycle.hasActiveAssignment || (lifecycle.kpis && lifecycle.kpis.length === 0) ? (
        <div className="p-12 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
          <AlertCircle className="mx-auto text-slate-400" size={32} />
          <p className="text-sm font-bold text-slate-700">No appraisal report available for the selected employee and cycle.</p>
          <p className="text-xs text-slate-400 font-normal">Please select another employee or appraisal cycle month.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Employee Header & Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-pms-lightGreen text-pms-darkGreen flex items-center justify-center font-bold text-lg shadow-xs">
                  {(selectedEmployeeObj?.name || lifecycle?.employee?.name || 'E').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-pms-gray">
                      {selectedEmployeeObj?.name || lifecycle?.employee?.name || 'Employee'}
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-extrabold text-[10px] rounded-full">
                      EMP-{selectedEmployeeObj?.id || lifecycle?.employee?.id || selectedEmployeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEmployeeObj?.designation || lifecycle?.employee?.designation || '-'} • {selectedEmployeeObj?.department || lifecycle?.employee?.department || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {lifecycle?.status?.replace(/_/g, ' ') || 'ACTIVE'}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
                  {cycleMonth}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Department</span>
                <span className="font-bold text-slate-700">
                  {selectedEmployeeObj?.department || lifecycle?.employee?.department || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Team</span>
                <span className="font-bold text-slate-700">
                  {selectedEmployeeObj?.team || lifecycle?.employee?.team || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Reporting Manager</span>
                <span className="font-bold text-purple-700">
                  {selectedEmployeeObj?.managerName || lifecycle?.employee?.managerName || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Overall Score</span>
                <span className="font-extrabold text-pms-darkGreen">
                  {lifecycle?.overallScore !== null && lifecycle?.overallScore !== undefined
                    ? lifecycle.overallScore.toFixed(2) + ' / 5.00'
                    : 'Pending Calibration'}
                </span>
              </div>
            </div>
          </div>

          {/* Final Score Card */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-pms-green/30 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award size={32} className="text-pms-green" />
              <div>
                <h4 className="text-sm font-bold text-pms-darkGreen">Final Performance Result</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Performance Category: <strong className="text-pms-darkGreen">{lifecycle.performanceGrade || (lifecycle.overallScore ? deriveGrade(lifecycle.overallScore) : 'Pending Calibration')}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cycle: {cycleMonth} • Finalized Date: {lifecycle.finalizedDate || 'In Review'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-pms-darkGreen">
                {lifecycle.overallScore !== null && lifecycle.overallScore !== undefined ? lifecycle.overallScore.toFixed(2) : '0.00'}
              </span>
              <span className="text-xs text-slate-400 font-normal"> / 5.00</span>
            </div>
          </div>

          {/* Evaluations Comparison Chart (Recharts) */}
          {lifecycle.kpis && lifecycle.kpis.length > 0 && (
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-pms-gray flex items-center gap-2">
                  <BarChart3 size={18} className="text-pms-green" />
                  <span>Evaluations Comparison Chart ({selectedEmployeeObj?.name || lifecycle.employee?.name} - {cycleMonth})</span>
                </h3>
                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#94A3B8]"></span>
                    <span className="text-slate-600">● Self Rating</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#4A7637]"></span>
                    <span className="text-slate-600">● Manager Rating</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#1ea855]"></span>
                    <span className="text-slate-600">● HR Rating</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={lifecycle.kpis.map((kpi) => ({
                      name: kpi.kpiName.length > 18 ? kpi.kpiName.substring(0, 18) + '...' : kpi.kpiName,
                      fullName: kpi.kpiName,
                      'Self Rating': kpi.selfRating !== null && kpi.selfRating !== undefined ? kpi.selfRating : null,
                      'Manager Rating': kpi.managerRating !== null && kpi.managerRating !== undefined ? kpi.managerRating : null,
                      'HR Rating': kpi.hrRating !== null && kpi.hrRating !== undefined ? kpi.hrRating : null,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const kpiFullName = payload[0]?.payload?.fullName || label;
                          return (
                            <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-lg text-xs space-y-1.5">
                              <p className="font-bold text-pms-gray border-b border-slate-100 pb-1">{kpiFullName}</p>
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between space-x-4">
                                  <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
                                  <span className="font-bold text-slate-800">
                                    {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(1) : 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Bar dataKey="Self Rating" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Manager Rating" fill="#4A7637" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="HR Rating" fill="#1ea855" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dynamic KPI Visual Rating Chart */}
          {lifecycle.kpis && lifecycle.kpis.length > 0 && (
            <KpiRatingChart
              title={`KPI Performance Comparison - ${selectedEmployeeObj?.name || lifecycle?.employee?.name || 'Employee'} (${cycleMonth})`}
              items={lifecycle.kpis.map(k => ({
                kpiName: k.kpiName,
                weightage: k.weightage,
                selfRating: k.selfRating,
                managerRating: k.managerRating,
                hrRating: k.hrRating
              }))}
            />
          )}

          {/* Section 1: Role / Manager KPI Performance Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
              <Briefcase size={18} className="text-purple-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Role / Manager KPI Performance Breakdown
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Designation-mapped KPIs, self evidence, manager feedback, and calibrated ratings.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[200px]">KPI Name & Criteria</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-16">Weight</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">Self Rating</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">Manager Rating</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">HR Rating</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[220px]">Comments & Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {roleKpis.map((kpi) => (
                    <tr key={kpi.kpiId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-bold text-pms-gray">{kpi.kpiName}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{kpi.description}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-pms-darkGreen text-center align-top">
                        {kpi.weightage}%
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-center align-top">
                        {kpi.selfRating !== null && kpi.selfRating !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                            {kpi.selfRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-center align-top">
                        {kpi.managerRating !== null && kpi.managerRating !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                            {kpi.managerRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-center align-top">
                        {kpi.hrRating !== null && kpi.hrRating !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                            {kpi.hrRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top space-y-1.5 text-[11px]">
                        {(kpi.employeeComments || kpi.comments) && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-600 block text-[10px]">Employee Comment:</span>
                            <span className="text-slate-700">{kpi.employeeComments || kpi.comments}</span>
                          </div>
                        )}
                        {kpi.managerComments && (
                          <div className="bg-purple-50/40 p-2 rounded-lg border border-purple-200">
                            <span className="font-bold text-purple-700 block text-[10px]">Manager Comment:</span>
                            <span className="text-purple-900">{kpi.managerComments}</span>
                          </div>
                        )}
                        {kpi.hrComments && (
                          <div className="bg-blue-50/40 p-2 rounded-lg border border-blue-200">
                            <span className="font-bold text-blue-700 block text-[10px]">HR Comment:</span>
                            <span className="text-blue-900">{kpi.hrComments}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: HR Review KPI Evaluation */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  HR Review KPI Evaluation (Corporate Staff Competencies)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Corporate HR competencies evaluated by HR Administration (1.0 to 5.0 scale).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[180px]">HR Review KPI</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[220px]">Measurement Criteria</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Weight</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">HR Rating</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[240px]">HR Feedback</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {hrReviewKpis.map((kpi) => (
                    <tr key={kpi.kpiId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-bold text-pms-gray">{kpi.kpiName}</p>
                      </td>
                      <td className="px-4 py-4 text-[11px] text-slate-500 align-top">
                        {kpi.description}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-blue-700 text-center align-top">
                        {kpi.weightage}%
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-center align-top">
                        {kpi.hrRating !== null && kpi.hrRating !== undefined ? (
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-extrabold">
                            {kpi.hrRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-700">
                        {kpi.hrComments ? (
                          <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-200 text-blue-900">
                            {kpi.hrComments}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No specific feedback provided.</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-center align-top">
                        <span className={`px-2 py-1 rounded-full text-[9px] ${lifecycle.status === 'COMPLETED' || lifecycle.status === 'FINAL_RESULT_PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : kpi.hrRating !== null
                              ? 'bg-blue-100 text-blue-800 font-bold'
                              : 'bg-amber-100 text-amber-800 font-bold'
                          }`}>
                          {lifecycle.status === 'COMPLETED' || lifecycle.status === 'FINAL_RESULT_PUBLISHED' ? 'FINALIZED' : kpi.hrRating !== null ? 'RATED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Reviews / Remarks */}
          {lifecycle.reviews && lifecycle.reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Overall Review Remarks & Calibration History
              </h4>
              <div className="space-y-3">
                {lifecycle.reviews.map((rev, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-3 text-xs">
                    <UserCheck size={16} className="text-pms-green shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pms-gray">{rev.reviewerName} ({rev.reviewerRole})</span>
                        <span className="text-[10px] text-slate-400 font-medium">{rev.reviewDate}</span>
                      </div>
                      <p className="text-slate-600 mt-1 italic">"{rev.comments}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default HrReportsPage;
