import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Employee, EmployeeLifecycleData } from '../../types';
import {
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  Lock,
  FileCheck,
  ChevronRight,
  Edit2,
  Save,
  X,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { RatingScaleLegend } from '../../components/RatingScaleLegend';
import { KpiRatingChart } from '../../components/KpiRatingChart';

export const HrPmsLifecyclePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [lifecycleData, setLifecycleData] = useState<EmployeeLifecycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Finalize Confirmation Modal State
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [hrComments, setHrComments] = useState('Reviewed and approved by HR Administration.');
  const [finalizing, setFinalizing] = useState(false);

  // Dynamic HR, Manager, & Self Ratings/Comments state for full HR Administrator editing
  const [editableSelfRatings, setEditableSelfRatings] = useState<Record<number, number | ''>>({});
  const [editableSelfComments, setEditableSelfComments] = useState<Record<number, string>>({});
  const [editableManagerRatings, setEditableManagerRatings] = useState<Record<number, number | ''>>({});
  const [editableManagerComments, setEditableManagerComments] = useState<Record<number, string>>({});
  const [editableHrRatings, setEditableHrRatings] = useState<Record<number, number | ''>>({});
  const [editableHrComments, setEditableHrComments] = useState<Record<number, string>>({});
  const [savingRatings, setSavingRatings] = useState(false);

  useEffect(() => {
    // Initial load: search all employees
    searchEmployees('');
  }, []);

  const searchEmployees = (query: string) => {
    hrApi.searchLifecycleEmployees(query)
      .then((data) => {
        setEmployeeResults(data);
        if (data.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(data[0].id);
          fetchLifecycle(data[0].id);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    searchEmployees(q);
  };

  const fetchLifecycle = (empId: number) => {
    setLoading(true);
    setError(null);
    setSelectedEmployeeId(empId);
    hrApi.getLifecycleDetail(empId)
      .then((data) => {
        setLifecycleData(data);
        const selfRatingMap: Record<number, number | ''> = {};
        const selfCommentMap: Record<number, string> = {};
        const mgrRatingMap: Record<number, number | ''> = {};
        const mgrCommentMap: Record<number, string> = {};
        const hrRatingMap: Record<number, number | ''> = {};
        const hrCommentMap: Record<number, string> = {};

        const allKpis = [...(data.kpis || []), ...(data.hrReviewKpis || [])];
        allKpis.forEach(k => {
          selfRatingMap[k.kpiId] = k.selfRating !== null && k.selfRating !== undefined ? k.selfRating : '';
          selfCommentMap[k.kpiId] = k.employeeComments || k.comments || '';
          mgrRatingMap[k.kpiId] = k.managerRating !== null && k.managerRating !== undefined ? k.managerRating : '';
          mgrCommentMap[k.kpiId] = k.managerComments || '';
          hrRatingMap[k.kpiId] = k.hrRating !== null && k.hrRating !== undefined ? k.hrRating : (k.managerRating !== null ? k.managerRating : '');
          hrCommentMap[k.kpiId] = k.hrComments || '';
        });

        setEditableSelfRatings(selfRatingMap);
        setEditableSelfComments(selfCommentMap);
        setEditableManagerRatings(mgrRatingMap);
        setEditableManagerComments(mgrCommentMap);
        setEditableHrRatings(hrRatingMap);
        setEditableHrComments(hrCommentMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load employee PMS lifecycle.');
        setLoading(false);
      });
  };

  const roleKpis = lifecycleData?.kpis ? lifecycleData.kpis.filter(k => k.kpiCategory !== 'HR_REVIEW_KPI') : [];
  const hrReviewKpis = lifecycleData?.kpis ? lifecycleData.kpis.filter(k => k.kpiCategory === 'HR_REVIEW_KPI') : (lifecycleData?.hrReviewKpis || []);

  const calculateLiveScores = () => {
    if (!lifecycleData?.kpis || lifecycleData.kpis.length === 0) {
      return { selfScore: 0.0, managerScore: 0.0, hrScore: 0.0, finalScore: 0.0 };
    }

    let selfWeightedSum = 0.0;
    let mgrWeightedSum = 0.0;
    let hrWeightedSum = 0.0;

    // Role KPIs for Self & Manager
    const rKpis = roleKpis.length > 0 ? roleKpis : lifecycleData.kpis;
    rKpis.forEach(k => {
      const w = k.weightage / 100.0;
      const selfVal = editableSelfRatings[k.kpiId] !== undefined && editableSelfRatings[k.kpiId] !== ''
        ? (editableSelfRatings[k.kpiId] as number)
        : (k.selfRating ?? 0.0);
      selfWeightedSum += selfVal * w;

      const mgrVal = editableManagerRatings[k.kpiId] !== undefined && editableManagerRatings[k.kpiId] !== ''
        ? (editableManagerRatings[k.kpiId] as number)
        : (k.managerRating ?? 0.0);
      mgrWeightedSum += mgrVal * w;
    });

    // HR Review KPIs for HR Rating
    const hKpis = hrReviewKpis.length > 0 ? hrReviewKpis : lifecycleData.kpis;
    hKpis.forEach(k => {
      const w = k.weightage / 100.0;
      const hrVal = editableHrRatings[k.kpiId] !== undefined && editableHrRatings[k.kpiId] !== ''
        ? (editableHrRatings[k.kpiId] as number)
        : (k.hrRating ?? 0.0);
      hrWeightedSum += hrVal * w;
    });

    const selfScore = Math.round(selfWeightedSum * 100.0) / 100.0;
    const managerScore = Math.round(mgrWeightedSum * 100.0) / 100.0;
    const hrScore = Math.round(hrWeightedSum * 100.0) / 100.0;

    let finalScore = 0.0;
    if (managerScore > 0 && hrScore > 0) {
      finalScore = Math.round(((managerScore + hrScore) / 2.0) * 100.0) / 100.0;
    } else if (hrScore > 0) {
      finalScore = hrScore;
    } else if (managerScore > 0) {
      finalScore = managerScore;
    }

    return { selfScore, managerScore, hrScore, finalScore };
  };

  const handleSelfRatingChange = (kpiId: number, val: string) => {
    const num: number | '' = val === '' ? '' : parseFloat(val);
    if (typeof num === 'number' && (isNaN(num) || num < 1 || num > 5)) return;
    setEditableSelfRatings(prev => ({ ...prev, [kpiId]: num }));
  };

  const handleSelfCommentChange = (kpiId: number, val: string) => {
    setEditableSelfComments(prev => ({ ...prev, [kpiId]: val }));
  };

  const handleManagerRatingChange = (kpiId: number, val: string) => {
    const num: number | '' = val === '' ? '' : parseFloat(val);
    if (typeof num === 'number' && (isNaN(num) || num < 1 || num > 5)) return;
    setEditableManagerRatings(prev => ({ ...prev, [kpiId]: num }));
  };

  const handleManagerCommentChange = (kpiId: number, val: string) => {
    setEditableManagerComments(prev => ({ ...prev, [kpiId]: val }));
  };

  const handleHrRatingChange = (kpiId: number, val: string) => {
    const num: number | '' = val === '' ? '' : parseFloat(val);
    if (typeof num === 'number' && (isNaN(num) || num < 1 || num > 5)) return;
    setEditableHrRatings(prev => ({ ...prev, [kpiId]: num }));
  };

  const handleHrCommentChange = (kpiId: number, val: string) => {
    setEditableHrComments(prev => ({ ...prev, [kpiId]: val }));
  };

  const handleSaveHrRatings = async () => {
    if (!lifecycleData || !lifecycleData.assignmentId) return;
    try {
      setSavingRatings(true);
      setError(null);

      const allKpis = [...(lifecycleData.kpis || []), ...(lifecycleData.hrReviewKpis || [])];
      const payload = {
        ratings: allKpis.map(k => ({
          kpiId: k.kpiId,
          selfRating: typeof editableSelfRatings[k.kpiId] === 'number' ? (editableSelfRatings[k.kpiId] as number) : undefined,
          selfComment: editableSelfComments[k.kpiId] !== undefined ? editableSelfComments[k.kpiId] : undefined,
          employeeComment: editableSelfComments[k.kpiId] !== undefined ? editableSelfComments[k.kpiId] : undefined,
          managerRating: typeof editableManagerRatings[k.kpiId] === 'number' ? (editableManagerRatings[k.kpiId] as number) : undefined,
          managerComment: editableManagerComments[k.kpiId] !== undefined ? editableManagerComments[k.kpiId] : undefined,
          hrRating: typeof editableHrRatings[k.kpiId] === 'number' ? (editableHrRatings[k.kpiId] as number) : undefined,
          hrComment: editableHrComments[k.kpiId] !== undefined ? editableHrComments[k.kpiId] : undefined,
          comments: editableHrComments[k.kpiId] !== undefined ? editableHrComments[k.kpiId] : undefined
        })),
        hrComments: hrComments.trim()
      };

      await hrApi.saveHrRatings(lifecycleData.assignmentId, payload);
      setSuccess('Appraisal changes saved successfully.');
      if (selectedEmployeeId) {
        await fetchLifecycle(selectedEmployeeId);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save HR review', err);
      setError(err?.response?.data?.message || 'Failed to save HR review.');
    } finally {
      setSavingRatings(false);
    }
  };

  const handleSaveSingleKpi = async (targetKpiId: number) => {
    if (!lifecycleData || !lifecycleData.assignmentId) return;
    try {
      setSavingRatings(true);
      setError(null);

      const payload = {
        ratings: [{
          kpiId: targetKpiId,
          selfRating: typeof editableSelfRatings[targetKpiId] === 'number' ? (editableSelfRatings[targetKpiId] as number) : undefined,
          selfComment: editableSelfComments[targetKpiId] !== undefined ? editableSelfComments[targetKpiId] : undefined,
          employeeComment: editableSelfComments[targetKpiId] !== undefined ? editableSelfComments[targetKpiId] : undefined,
          managerRating: typeof editableManagerRatings[targetKpiId] === 'number' ? (editableManagerRatings[targetKpiId] as number) : undefined,
          managerComment: editableManagerComments[targetKpiId] !== undefined ? editableManagerComments[targetKpiId] : undefined,
          hrRating: typeof editableHrRatings[targetKpiId] === 'number' ? (editableHrRatings[targetKpiId] as number) : undefined,
          hrComment: editableHrComments[targetKpiId] !== undefined ? editableHrComments[targetKpiId] : undefined,
          comments: editableHrComments[targetKpiId] !== undefined ? editableHrComments[targetKpiId] : undefined
        }],
        hrComments: hrComments.trim()
      };

      await hrApi.saveHrRatings(lifecycleData.assignmentId, payload);
      setSuccess('Appraisal changes saved successfully.');
      if (selectedEmployeeId) {
        await fetchLifecycle(selectedEmployeeId);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save KPI rating', err);
      setError(err?.response?.data?.message || 'Failed to save KPI rating.');
    } finally {
      setSavingRatings(false);
    }
  };

  const deriveGrade = (score: number) => {
    if (score >= 4.5) return 'Outstanding Performance';
    if (score >= 4.0) return 'Excellent Performance';
    if (score >= 3.5) return 'Very Good Performance';
    if (score >= 3.0) return 'Good Performance';
    if (score >= 2.0) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const openFinalizeModal = () => {
    setError(null);
    if (!lifecycleData || !lifecycleData.assignmentId) return;

    // Validate role KPIs
    const rKpis = roleKpis.length > 0 ? roleKpis : lifecycleData.kpis;
    for (const k of rKpis) {
      if (k.selfRating === null) {
        setError(`Cannot finalize PMS: Employee self-rating is incomplete for "${k.kpiName}".`);
        return;
      }
      const mgrVal = editableManagerRatings[k.kpiId] !== undefined && editableManagerRatings[k.kpiId] !== ''
        ? editableManagerRatings[k.kpiId]
        : k.managerRating;
      if (mgrVal === null || mgrVal === undefined || mgrVal === '') {
        setError(`Cannot finalize PMS: Manager rating is missing for "${k.kpiName}".`);
        return;
      }
    }

    // Validate HR Review KPIs
    const hKpis = hrReviewKpis.length > 0 ? hrReviewKpis : lifecycleData.kpis;
    for (const k of hKpis) {
      const hrVal = editableHrRatings[k.kpiId] !== undefined && editableHrRatings[k.kpiId] !== ''
        ? editableHrRatings[k.kpiId]
        : k.hrRating;
      if (hrVal === null || hrVal === undefined || hrVal === '' || (typeof hrVal === 'number' && hrVal <= 0)) {
        setError(`Please complete all HR Review KPI ratings before finalizing the PMS (Missing for: "${k.kpiName}").`);
        return;
      }
    }

    setFinalizeModalOpen(true);
  };

  const handleFinalizePms = async () => {
    if (!lifecycleData || !lifecycleData.assignmentId) return;

    const scores = calculateLiveScores();
    const finalGrade = deriveGrade(scores.finalScore);

    setFinalizing(true);
    setError(null);
    try {
      // First persist any current unsaved rating changes
      await hrApi.saveHrRatings(lifecycleData.assignmentId, {
        ratings: lifecycleData.kpis.map(k => ({
          kpiId: k.kpiId,
          hrRating: typeof editableHrRatings[k.kpiId] === 'number' ? (editableHrRatings[k.kpiId] as number) : undefined,
          managerRating: typeof editableManagerRatings[k.kpiId] === 'number' ? (editableManagerRatings[k.kpiId] as number) : undefined
        })),
        hrComments: hrComments.trim()
      });

      const res = await hrApi.finalizePms(lifecycleData.assignmentId, {
        overallScore: scores.finalScore,
        performanceGrade: finalGrade,
        hrComments: hrComments.trim()
      });

      setSuccess(`PMS cycle successfully finalized and locked! Final Score: ${res.finalScore.toFixed(2)} / 5.00 (${res.grade})`);
      setFinalizeModalOpen(false);
      if (selectedEmployeeId) {
        fetchLifecycle(selectedEmployeeId);
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to finalize PMS.');
    } finally {
      setFinalizing(false);
    }
  };

  const isCompleted = lifecycleData?.status === 'COMPLETED' || lifecycleData?.status === 'FINAL_RESULT_PUBLISHED';
  const liveScores = calculateLiveScores();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-pms-gray mb-1"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <h2 className="text-2xl font-bold text-pms-gray">Employee PMS Lifecycle Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time workflow stages, calibrate Manager ratings, submit HR Review ratings, and finalize appraisals.
          </p>
        </div>
      </div>

      <RatingScaleLegend className="my-3" />

      {success && (
        <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-center space-x-3 text-xs text-pms-darkGreen font-bold animate-slideIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-800 font-semibold animate-slideIn">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Search Panel, Right Lifecycle View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Staff Directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, role..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Active Corporate Staff ({employeeResults.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
              {employeeResults.map((emp) => {
                const isSelected = emp.id === selectedEmployeeId;
                return (
                  <button
                    key={emp.id}
                    onClick={() => fetchLifecycle(emp.id)}
                    className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${isSelected
                        ? 'bg-pms-lightGreen/60 text-pms-darkGreen border border-pms-green/40 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{emp.name}</p>
                      <p className="text-[11px] text-slate-400">{emp.designation || 'Staff'} • {emp.department || 'Aseuro'}</p>
                      <p className="text-[10px] text-slate-400">{emp.email}</p>
                    </div>
                    <ChevronRight size={16} className={isSelected ? 'text-pms-darkGreen' : 'text-slate-300'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Lifecycle Tracker */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-xs text-slate-400 shadow-sm">
              Loading employee lifecycle details...
            </div>
          ) : !lifecycleData ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-xs text-slate-400 shadow-sm">
              Select an employee on the left to inspect appraisal workflow progression.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employee Overview Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-extrabold text-pms-gray">{lifecycleData.employee.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                      {isCompleted ? 'PMS Finalized' : 'PMS Cycle Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {lifecycleData.employee.designation} • {lifecycleData.employee.department} ({lifecycleData.employee.team})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Reporting Manager: <strong className="text-slate-600">{lifecycleData.employee.managerName || 'None'}</strong> • Cycle: <strong className="text-pms-darkGreen">{lifecycleData.cycleMonth || 'August 2026'}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {!isCompleted ? (
                    <>
                      <button
                        onClick={handleSaveHrRatings}
                        disabled={savingRatings}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                      >
                        <Save size={15} />
                        <span>{savingRatings ? 'Saving...' : 'Save HR Review'}</span>
                      </button>
                      <button
                        onClick={openFinalizeModal}
                        className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5"
                      >
                        <Send size={15} />
                        <span>Finalise and Submit</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                      <Lock size={14} className="text-emerald-700" />
                      <span>Record Finalized & Locked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic 5-Stage Lifecycle Progress Bar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Appraisal Workflow Progression Checkpoints
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {lifecycleData.workflowStages.map((st) => {
                    const isDone = st.status === 'Completed';
                    const isInProg = st.status === 'In Progress' || st.status === 'Pending';
                    return (
                      <div
                        key={st.step}
                        className={`p-3 rounded-xl border text-center transition-all ${isDone
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            : isInProg
                              ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-200/50'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isDone ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : (
                            <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${isInProg ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                              {st.step}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold truncate">{st.title}</p>
                        <p className="text-[10px] font-semibold mt-0.5 opacity-80">{st.status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Score Summary Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Appraisal Score Breakdown & Calibration
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    * Employee Self Rating is strictly excluded from Final Result
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Self Score</p>
                    <p className="text-base font-extrabold text-slate-700 mt-1">
                      {liveScores.selfScore.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 5.00</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Reference Only</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Manager Weighted Score</p>
                    <p className="text-base font-extrabold text-purple-900 mt-1">
                      {liveScores.managerScore.toFixed(2)} <span className="text-xs text-purple-400 font-normal">/ 5.00</span>
                    </p>
                    <p className="text-[9px] text-purple-600 font-semibold mt-0.5">Role KPIs</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">HR Weighted Score</p>
                    <p className="text-base font-extrabold text-blue-900 mt-1">
                      {liveScores.hrScore.toFixed(2)} <span className="text-xs text-blue-400 font-normal">/ 5.00</span>
                    </p>
                    <p className="text-[9px] text-blue-600 font-semibold mt-0.5">5 HR Review KPIs</p>
                  </div>

                  <div className="p-3 bg-pms-lightGreen/40 rounded-xl border border-pms-green/30 shadow-xs">
                    <p className="text-[10px] font-bold text-pms-darkGreen uppercase tracking-wider">Final Result</p>
                    <p className="text-base font-extrabold text-pms-darkGreen mt-1">
                      {isCompleted && lifecycleData.overallScore !== null && lifecycleData.overallScore !== undefined
                        ? lifecycleData.overallScore.toFixed(2)
                        : liveScores.finalScore.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ 5.00</span>
                    </p>
                    <p className="text-[9px] text-pms-darkGreen font-bold mt-0.5">
                      {isCompleted ? (lifecycleData.performanceGrade || deriveGrade(lifecycleData.overallScore || 0)) : deriveGrade(liveScores.finalScore)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Rating Chart */}
              {lifecycleData.kpis && lifecycleData.kpis.length > 0 && (
                <KpiRatingChart
                  title={`Performance Visual Breakdown - ${lifecycleData.employee.name}`}
                  items={lifecycleData.kpis.map(k => ({
                    kpiName: k.kpiName,
                    weightage: k.weightage,
                    selfRating: k.selfRating,
                    managerRating: editableManagerRatings[k.kpiId] !== undefined && editableManagerRatings[k.kpiId] !== ''
                      ? Number(editableManagerRatings[k.kpiId])
                      : k.managerRating,
                    hrRating: editableHrRatings[k.kpiId] !== undefined && editableHrRatings[k.kpiId] !== ''
                      ? Number(editableHrRatings[k.kpiId])
                      : k.hrRating
                  }))}
                />
              )}

              {/* Section 1: Role / Manager KPIs Matrix with Full HR Editing */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={18} className="text-purple-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Role / Manager KPIs Evaluation
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Full HR Administrator edit permissions: Edit Self, Manager, & HR ratings (1.0 - 5.0) and comments.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveHrRatings}
                    disabled={savingRatings}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 self-start md:self-auto"
                  >
                    <Save size={14} />
                    <span>{savingRatings ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[180px]">KPI Description</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-16">Weight</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[170px]">Self Evaluation</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[170px]">Manager Evaluation</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[170px]">HR Evaluation</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(roleKpis.length > 0 ? roleKpis : lifecycleData.kpis).map((kpi) => {
                        const curSelfRating = editableSelfRatings[kpi.kpiId] ?? (kpi.selfRating ?? '');
                        const curSelfComment = editableSelfComments[kpi.kpiId] ?? (kpi.employeeComments || kpi.comments || '');
                        const curMgrRating = editableManagerRatings[kpi.kpiId] ?? (kpi.managerRating ?? '');
                        const curMgrComment = editableManagerComments[kpi.kpiId] ?? (kpi.managerComments || '');
                        const curHrRating = editableHrRatings[kpi.kpiId] ?? (kpi.hrRating ?? '');
                        const curHrComment = editableHrComments[kpi.kpiId] ?? (kpi.hrComments || '');

                        return (
                          <tr key={kpi.kpiId} className="hover:bg-slate-50/50">
                            <td className="px-4 py-4 align-top">
                              <p className="text-xs font-bold text-pms-gray">{kpi.kpiName}</p>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{kpi.description}</p>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-pms-darkGreen text-center align-top">
                              {kpi.weightage}%
                            </td>
                            <td className="px-4 py-4 align-top space-y-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Self Rating</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  value={curSelfRating}
                                  onChange={(e) => handleSelfRatingChange(kpi.kpiId, e.target.value)}
                                  placeholder="1.0 - 5.0"
                                  disabled={true}
                                  className="w-full px-2 py-1 text-xs font-bold text-emerald-900 bg-emerald-50/60 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Self Comment</label>
                                <textarea
                                  rows={2}
                                  value={curSelfComment}
                                  onChange={(e) => handleSelfCommentChange(kpi.kpiId, e.target.value)}
                                  placeholder="Employee comment..."
                                  className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top space-y-2">
                              <div>
                                <label className="block text-[10px] font-bold text-purple-700 uppercase">Manager Rating</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  value={curMgrRating}
                                  onChange={(e) => handleManagerRatingChange(kpi.kpiId, e.target.value)}
                                  placeholder="1.0 - 5.0"
                                  className="w-full px-2 py-1 text-xs font-bold text-purple-900 bg-purple-50/60 border border-purple-300 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-purple-700 uppercase">Manager Comment</label>
                                <textarea
                                  rows={2}
                                  value={curMgrComment}
                                  onChange={(e) => handleManagerCommentChange(kpi.kpiId, e.target.value)}
                                  placeholder="Manager feedback..."
                                  className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-purple-50/30 border border-purple-200 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top space-y-2">
                              <div>
                                <label className="block text-[10px] font-bold text-blue-700 uppercase">HR Rating</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  value={curHrRating}
                                  onChange={(e) => handleHrRatingChange(kpi.kpiId, e.target.value)}
                                  placeholder="1.0 - 5.0"
                                  className="w-full px-2 py-1 text-xs font-bold text-blue-900 bg-blue-50/60 border border-blue-300 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-blue-700 uppercase">HR Comment</label>
                                <textarea
                                  rows={2}
                                  value={curHrComment}
                                  onChange={(e) => handleHrCommentChange(kpi.kpiId, e.target.value)}
                                  placeholder="HR feedback..."
                                  className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-blue-50/30 border border-blue-200 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-center align-top">
                              <span className={`px-2 py-1 rounded-full text-[9px] ${isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : curHrRating !== '' || curMgrRating !== ''
                                    ? 'bg-pms-lightGreen text-pms-darkGreen font-bold'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isCompleted ? 'FINALIZED' : (curHrRating !== '' || curMgrRating !== '') ? 'RATED' : 'PENDING'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleSaveSingleKpi(kpi.kpiId)}
                                disabled={savingRatings}
                                className="px-3 py-1 bg-pms-green hover:bg-pms-darkGreen text-white text-[11px] font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Save size={12} />
                                <span>Save</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: HR Review KPIs Evaluation */}
              <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        HR Review KPIs Evaluation (All Corporate Staff)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Provide HR Ratings (1.0 - 5.0) and dedicated HR Feedback for Leave Pattern, Team Collaboration, Punctuality, New Initiatives, & Rewards.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveHrRatings}
                    disabled={savingRatings}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 self-start md:self-auto"
                  >
                    <Save size={14} />
                    <span>{savingRatings ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[180px]">HR Review KPI</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[220px]">Measurement Criteria</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Weight</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-28">HR Rating</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase min-w-[240px]">HR Feedback</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-24">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(hrReviewKpis.length > 0 ? hrReviewKpis : lifecycleData.kpis).map((kpi) => {
                        const currentHrRating = editableHrRatings[kpi.kpiId] ?? (kpi.hrRating ?? '');
                        const currentHrComment = editableHrComments[kpi.kpiId] ?? (kpi.hrComments || '');

                        return (
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
                              <select
                                value={currentHrRating}
                                onChange={(e) => handleHrRatingChange(kpi.kpiId, e.target.value)}
                                className="w-20 px-2 py-1.5 text-center font-bold text-xs rounded-lg border border-blue-300 bg-blue-50/80 text-blue-900 focus:ring-2 focus:ring-pms-green focus:bg-white"
                              >
                                <option value="">Select</option>
                                <option value="5.0">5.0</option>
                                <option value="4.5">4.5</option>
                                <option value="4.0">4.0</option>
                                <option value="3.5">3.5</option>
                                <option value="3.0">3.0</option>
                                <option value="2.5">2.5</option>
                                <option value="2.0">2.0</option>
                                <option value="1.5">1.5</option>
                                <option value="1.0">1.0</option>
                              </select>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <textarea
                                rows={2}
                                value={currentHrComment}
                                onChange={(e) => handleHrCommentChange(kpi.kpiId, e.target.value)}
                                placeholder={`Enter HR feedback for ${kpi.kpiName}...`}
                                className="w-full px-3 py-2 text-xs text-slate-700 bg-blue-50/20 border border-blue-200 rounded-lg focus:ring-2 focus:ring-pms-green focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-center align-top">
                              <span className={`px-2 py-1 rounded-full text-[9px] ${isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : currentHrRating !== ''
                                    ? 'bg-blue-100 text-blue-800 font-bold'
                                    : 'bg-amber-100 text-amber-800 font-bold'
                                }`}>
                                {isCompleted ? 'FINALIZED' : currentHrRating !== '' ? 'RATED' : 'PENDING'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleSaveSingleKpi(kpi.kpiId)}
                                disabled={savingRatings}
                                className="px-3 py-1 bg-pms-green hover:bg-pms-darkGreen text-white text-[11px] font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Save size={12} />
                                <span>Save</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Score Card if Finalized */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-pms-green/30 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Award size={32} className="text-pms-green" />
                    <div>
                      <h4 className="text-sm font-bold text-pms-darkGreen">Finalized Appraisal Result</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Performance Grade: <strong className="text-pms-darkGreen">{lifecycleData.performanceGrade || deriveGrade(lifecycleData.overallScore || 0)}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Finalized Date: {lifecycleData.finalizedDate || 'August 2026'} • All appraisal records are locked.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-pms-darkGreen">
                      {lifecycleData.overallScore ? lifecycleData.overallScore.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-xs text-slate-400 font-normal"> / 5.00</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {finalizeModalOpen && lifecycleData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck size={20} className="text-pms-green" />
                <h3 className="text-base font-bold text-pms-gray">Confirm PMS Finalization</h3>
              </div>
              <button
                onClick={() => setFinalizeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to finalise this PMS record? After finalization, the PMS record will be locked and cannot be edited.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-pms-gray">{lifecycleData.employee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Self Score:</span>
                <span className="font-bold text-slate-600">{liveScores.selfScore.toFixed(2)} / 5.00 (Reference)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manager Weighted Score:</span>
                <span className="font-bold text-purple-700">{liveScores.managerScore.toFixed(2)} / 5.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">HR Weighted Score:</span>
                <span className="font-bold text-blue-700">{liveScores.hrScore.toFixed(2)} / 5.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-pms-darkGreen">Final Result:</span>
                <span className="font-extrabold text-pms-darkGreen">{liveScores.finalScore.toFixed(2)} / 5.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Performance Grade:</span>
                <span className="font-bold text-slate-700">{deriveGrade(liveScores.finalScore)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                HR General Remarks:
              </label>
              <textarea
                rows={2}
                value={hrComments}
                onChange={(e) => setHrComments(e.target.value)}
                placeholder="Reviewed and approved by HR Administration..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizePms}
                disabled={finalizing}
                className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Send size={14} />
                <span>{finalizing ? 'Finalizing...' : 'Confirm Finalize'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrPmsLifecyclePage;
