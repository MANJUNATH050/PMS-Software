import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { PmsAssignment, Kpi } from '../../types';
import {
  Target,
  Clock,
  CheckCircle2,
  Lock,
  Send,
  AlertCircle,
  AlertTriangle,
  Save,
  Info,
  Calendar,
  Award,
  ChevronRight,
  Star,
  Activity,
  Scale,
  Eye,
  X,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { RatingScaleLegend } from '../../components/RatingScaleLegend';
import { KpiRatingChart } from '../../components/KpiRatingChart';

export const ManagerMyKpisPage: React.FC = () => {
  const [assignment, setAssignment] = useState<PmsAssignment | null>(null);
  const [ratings, setRatings] = useState<Record<number, { rating: number | ''; comments: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedKpiForModal, setSelectedKpiForModal] = useState<Kpi | null>(null);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<PmsAssignment>('/employee/pms/current');
      setAssignment(res.data);

      const initialRatings: Record<number, { rating: number | ''; comments: string }> = {};
      if (res.data && res.data.kpis) {
        res.data.kpis.forEach((k: Kpi) => {
          initialRatings[k.kpiId] = {
            rating: k.selfRating !== null ? k.selfRating : '',
            comments: k.comments || ''
          };
        });
      }
      setRatings(initialRatings);
    } catch (err: any) {
      console.error('Failed to load manager assignment', err);
      setError(err.response?.data?.message || 'Unable to load your active PMS assignment.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmittedOrLocked =
    assignment?.status === 'SELF_ASSESSMENT_SUBMITTED' ||
    assignment?.status === 'MANAGER_REVIEW_PENDING' ||
    assignment?.status === 'MANAGER_REVIEW_SUBMITTED' ||
    assignment?.status === 'HR_REVIEW_PENDING' ||
    assignment?.status === 'HR_REVIEW_COMPLETED' ||
    assignment?.status === 'FINAL_RESULT_PUBLISHED' ||
    assignment?.status === 'COMPLETED';

  const isCompleted =
    assignment?.status === 'HR_REVIEW_COMPLETED' ||
    assignment?.status === 'FINAL_RESULT_PUBLISHED' ||
    assignment?.status === 'COMPLETED';

  const handleRatingSelect = (kpiId: number, num: number) => {
    if (isSubmittedOrLocked) return;
    setRatings((prev) => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], rating: num }
    }));
  };

  const handleRatingInputChange = (kpiId: number, value: string) => {
    if (isSubmittedOrLocked) return;
    const num = value === '' ? '' : parseFloat(value);
    if (typeof num === 'number' && (num < 0 || num > 5)) return;
    setRatings((prev) => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], rating: num }
    }));
  };

  const handleCommentsChange = (kpiId: number, comments: string) => {
    if (isSubmittedOrLocked) return;
    setRatings((prev) => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], comments }
    }));
  };

  // KPI Calculations
  const kpis = assignment?.kpis || [];
  const totalWeightage = Math.round(kpis.reduce((acc, k) => acc + (k.weightage || 0), 0));
  const isWeightageValid = totalWeightage === 100;

  // Calculate Overall Weighted Score (0 - 100%)
  const calculateOverallWeightedScorePercent = () => {
    if (!kpis.length) return 0;
    let totalScorePercent = 0;
    kpis.forEach((k) => {
      const r = ratings[k.kpiId]?.rating;
      if (typeof r === 'number') {
        totalScorePercent += (r / 5.0) * k.weightage;
      }
    });
    return Math.round(totalScorePercent * 10) / 10;
  };

  // Calculate Overall Self Rating (0.00 - 5.00)
  const calculateOverallSelfRating = () => {
    if (!kpis.length) return 0;
    let totalWeightedRating = 0;
    let totalWeight = 0;
    kpis.forEach((k) => {
      const r = ratings[k.kpiId]?.rating;
      if (typeof r === 'number') {
        totalWeightedRating += r * k.weightage;
        totalWeight += k.weightage;
      }
    });
    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedRating / totalWeight) * 100) / 100;
  };

  // Performance Status text based on score
  const getPerformanceStatus = (scorePercent: number) => {
    if (isCompleted) return 'Completed';
    if (isSubmittedOrLocked) return 'Under Review';
    if (scorePercent >= 90) return 'Outstanding';
    if (scorePercent >= 80) return 'Exceeds Expectations';
    if (scorePercent >= 70) return 'On Track';
    if (scorePercent >= 50) return 'Needs Improvement';
    if (scorePercent > 0) return 'Needs Significant Improvement';
    return 'Draft in Progress';
  };

  const overallScorePercent = calculateOverallWeightedScorePercent();
  const overallSelfRating = calculateOverallSelfRating();
  const performanceStatus = getPerformanceStatus(overallScorePercent);

  const handleSaveDraft = async () => {
    if (!assignment) return;
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        ratings: Object.entries(ratings).map(([kpiId, val]) => ({
          kpiId: parseInt(kpiId),
          selfRating: typeof val.rating === 'number' ? val.rating : null,
          comments: val.comments
        }))
      };
      await apiClient.put(`/employee/pms/${assignment.assignmentId}/draft`, payload);
      setSuccessMessage('Self-assessment draft saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!assignment) return;
    setIsConfirmSubmitOpen(false);

    try {
      setSubmitting(true);
      setError(null);

      // Validate all ratings are provided
      for (const k of assignment.kpis) {
        const val = ratings[k.kpiId]?.rating;
        if (typeof val !== 'number') {
          setError(`Please provide a rating for "${k.kpiName}".`);
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ratings: Object.entries(ratings).map(([kpiId, val]) => ({
          kpiId: parseInt(kpiId),
          selfRating: val.rating as number,
          comments: val.comments
        }))
      };

      await apiClient.post(`/employee/pms/${assignment.assignmentId}/submit`, payload);
      setSuccessMessage('Self-assessment submitted successfully! Your submission is now locked for review.');
      await fetchAssignment();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit self-assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        {/* Header Skeleton */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
        </div>
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 h-28"></div>
          ))}
        </div>
        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 h-96"></div>
      </div>
    );
  }

  // Error / Empty State
  if (error && !assignment) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link to="/manager/dashboard" className="hover:text-pms-green transition-colors">
            Manager Administration
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-800 font-bold">View My KPIs</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/80 shadow-2xs">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Active PMS Assignment</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {error || 'You currently do not have an active PMS assignment. Please contact HR if you believe this is incorrect.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={fetchAssignment}
              className="px-6 py-3 bg-[#1ea855] hover:bg-[#188c46] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all inline-flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. BREADCRUMB & PAGE HEADER */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link to="/manager/dashboard" className="hover:text-pms-green transition-colors">
            Manager Administration
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-800 font-bold">View My KPIs</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-pms-green uppercase tracking-wider mb-2">
              <Target size={16} />
              <span>Manager Self-Assessment • {assignment?.cycleMonth || 'August 2026'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My KPIs</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              View your assigned performance objectives, ratings, weightages and overall performance.
            </p>
          </div>

          {/* Top-Right Performance Period & Status Badge */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl flex items-center space-x-2.5">
              <Calendar size={16} className="text-[#1ea855]" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Performance Period</span>
                <span className="text-xs font-black text-slate-800">{assignment?.cycleMonth || 'August 2026'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl flex items-center space-x-2.5">
              <Award size={16} className="text-amber-500" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                {isCompleted ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </span>
                ) : isSubmittedOrLocked ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700">
                    <Lock size={12} />
                    <span>Submitted</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700">
                    <Clock size={12} />
                    <span>Draft in Progress</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RatingScaleLegend className="my-3" />

      {assignment?.kpis && assignment.kpis.length > 0 && (
        <KpiRatingChart
          title="My Manager KPI Self Evaluation Breakdown"
          items={assignment.kpis.map(k => ({
            kpiName: k.kpiName,
            weightage: k.weightage,
            selfRating: ratings[k.kpiId]?.rating !== undefined && ratings[k.kpiId]?.rating !== ''
              ? Number(ratings[k.kpiId].rating)
              : k.selfRating,
            managerRating: k.managerRating,
            hrRating: k.hrRating
          }))}
        />
      )}

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3 text-sm font-semibold animate-slideIn">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm font-semibold animate-slideIn">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. KPI SUMMARY SECTION (4 Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total KPIs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center shrink-0 border border-emerald-100">
            <Target size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total KPIs</span>
            <span className="text-2xl font-black text-slate-800">{kpis.length}</span>
            <span className="text-[11px] text-slate-400 font-medium block">Assigned Objectives</span>
          </div>
        </div>

        {/* Card 2: Total Weightage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isWeightageValid ? 'bg-emerald-50 text-[#1ea855] border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            <Scale size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Weightage</span>
            <span className="text-2xl font-black text-slate-800">{totalWeightage}%</span>
            <span className={`text-[11px] font-bold block ${isWeightageValid ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isWeightageValid ? '✓ Balanced (100%)' : '⚠ Must Equal 100%'}
            </span>
          </div>
        </div>

        {/* Card 3: Overall Rating */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
            <Star size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Overall Rating</span>
            <span className="text-2xl font-black text-slate-800">
              {overallSelfRating.toFixed(1)} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">Weighted Self Score</span>
          </div>
        </div>

        {/* Card 4: Performance Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Activity size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Performance Status</span>
            <span className="text-base font-black text-slate-800 line-clamp-1">{performanceStatus}</span>
            <span className="text-[11px] text-slate-400 font-medium block">
              {isSubmittedOrLocked ? 'Submission Locked' : 'Cycle Open'}
            </span>
          </div>
        </div>
      </div>

      {/* Weightage Validation Warning Banner (if != 100%) */}
      {!isWeightageValid && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center space-x-3 text-sm font-semibold animate-slideIn">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <span>Total KPI weightage must equal 100%. (Current total: {totalWeightage}%)</span>
        </div>
      )}

      {/* 3. MANAGER KPI TABLE ("My Performance KPIs") */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">My Performance KPIs</h2>
            <p className="text-xs text-slate-400 font-medium">
              Review assigned criteria, specify self-ratings (1 - 5) and detail key achievements.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
            {kpis.length} Objectives Assigned
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 w-12 text-center">#</th>
                <th className="py-4 px-4 min-w-[200px]">KPI</th>
                <th className="py-4 px-4 min-w-[260px]">Description / Measurement Criteria</th>
                <th className="py-4 px-4 min-w-[220px] text-center">Self Rating</th>
                <th className="py-4 px-4 min-w-[140px] text-center">Reviewer Rating</th>
                <th className="py-4 px-4 min-w-[100px] text-center">Weightage</th>
                <th className="py-4 px-4 min-w-[120px] text-center">Weighted Score</th>
                <th className="py-4 px-4 min-w-[110px] text-center">Status</th>
                <th className="py-4 px-4 sm:px-6 min-w-[100px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {kpis.map((kpi, idx) => {
                const currentRating = ratings[kpi.kpiId]?.rating ?? '';
                const currentComments = ratings[kpi.kpiId]?.comments ?? '';
                const weightedScore =
                  typeof currentRating === 'number'
                    ? ((currentRating / 5.0) * kpi.weightage).toFixed(1)
                    : '—';

                // Reviewer Rating Display
                const reviewerRatingDisplay =
                  kpi.managerRating !== null && kpi.managerRating !== undefined
                    ? `${Number(kpi.managerRating).toFixed(1)} / 5.0`
                    : kpi.hrRating !== null && kpi.hrRating !== undefined
                    ? `${Number(kpi.hrRating).toFixed(1)} / 5.0`
                    : 'Pending Review';

                return (
                  <React.Fragment key={kpi.kpiId}>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      {/* Index */}
                      <td className="py-4 px-4 sm:px-6 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* KPI Name */}
                      <td className="py-4 px-4 font-bold text-slate-800">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-900 block">{kpi.kpiName}</span>
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-[#1ea855] text-[10px] font-bold rounded-md border border-emerald-100">
                            Objective
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4 text-slate-500 font-medium leading-relaxed max-w-sm">
                        <p className="line-clamp-2">{kpi.description}</p>
                      </td>

                      {/* Self Rating (Interactive 1-5 Scale) */}
                      <td className="py-4 px-4 text-center">
                        {isSubmittedOrLocked ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-black text-sm">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span>{typeof currentRating === 'number' ? `${currentRating.toFixed(1)} / 5.0` : '—'}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-1.5">
                            {/* 1 - 5 Quick Select Buttons */}
                            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80 space-x-1">
                              {[1, 2, 3, 4, 5].map((val) => {
                                const isSelected = currentRating === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleRatingSelect(kpi.kpiId, val)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                      isSelected
                                        ? 'bg-[#1ea855] text-white shadow-xs scale-105'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                    }`}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                            {/* Optional Precision Decimal Input */}
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={currentRating}
                              onChange={(e) => handleRatingInputChange(kpi.kpiId, e.target.value)}
                              placeholder="0.0"
                              className="w-16 h-7 text-center text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#1ea855] focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                      </td>

                      {/* Reviewer / Manager Rating (Strictly Read-Only) */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                            reviewerRatingDisplay === 'Pending Review'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                          }`}
                        >
                          {reviewerRatingDisplay}
                        </span>
                      </td>

                      {/* Weightage */}
                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold">
                          {kpi.weightage}%
                        </span>
                      </td>

                      {/* Weighted Score */}
                      <td className="py-4 px-4 text-center font-black text-pms-darkGreen">
                        {weightedScore !== '—' ? `${weightedScore}%` : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {typeof currentRating === 'number' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200/80">
                            Rated
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200/80">
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedKpiForModal(kpi)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center space-x-1.5"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>

                    {/* Self Comments Row */}
                    <tr className="bg-slate-50/30 border-b border-slate-100">
                      <td colSpan={9} className="py-3 px-4 sm:px-6">
                        <div className="flex items-start space-x-3 max-w-4xl">
                          <MessageSquare size={16} className="text-slate-400 shrink-0 mt-2" />
                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Self Assessment / Comments
                            </label>
                            <textarea
                              disabled={isSubmittedOrLocked}
                              value={currentComments}
                              onChange={(e) => handleCommentsChange(kpi.kpiId, e.target.value)}
                              placeholder={
                                isSubmittedOrLocked
                                  ? 'No comments provided.'
                                  : 'Describe your achievements, contributions and progress for this KPI...'
                              }
                              rows={2}
                              className={`w-full p-3 rounded-xl border text-xs font-medium ${
                                isSubmittedOrLocked
                                  ? 'bg-slate-100/70 text-slate-600 cursor-not-allowed border-slate-200'
                                  : 'bg-white text-slate-800 border-slate-200 focus:border-[#1ea855] focus:ring-1 focus:ring-emerald-500 outline-none'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Table Footer: Total Weightage & Total Weighted Score */}
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                <td colSpan={5} className="py-4 px-6 text-right uppercase tracking-wider">
                  Total Weightage & Performance Summary:
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                    isWeightageValid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {totalWeightage}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center font-black text-pms-darkGreen text-sm">
                  {overallScorePercent}%
                </td>
                <td colSpan={2} className="py-4 px-6"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. OVERALL PERFORMANCE SECTION & REVIEWER FEEDBACK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Performance Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center">
              <Activity size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Overall Performance</h3>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Self Rating</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {overallSelfRating.toFixed(1)} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weighted Score</span>
              <span className="text-xl font-black text-[#1ea855] mt-1 block">{overallScorePercent}%</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reviewer Rating</span>
              <span className="text-sm font-black text-slate-800 mt-1 block">
                {assignment?.overallScore ? `${assignment.overallScore.toFixed(1)} / 5.0` : 'Pending'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Performance Status</span>
              <span className="text-sm font-black text-emerald-700 mt-1 block">{performanceStatus}</span>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Overall Performance Progress</span>
              <span className="text-[#1ea855]">{overallScorePercent}% Achieved</span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-[#1ea855] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(overallScorePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reviewer / HR Comments Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reviewer Feedback</h3>
            </div>

            {assignment?.reviews && assignment.reviews.length > 0 ? (
              <div className="space-y-3">
                {assignment.reviews.map((rev, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{rev.reviewerName}</span>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                        {rev.reviewerRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{rev.comments}</p>
                    {rev.reviewDate && (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Reviewed on {rev.reviewDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-center space-y-2">
                <Info size={24} className="text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Reviewer feedback will appear here once the review is completed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. ACTION BUTTONS FOOTER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PMS Workflow Stage</span>
          <span className="text-sm font-black text-slate-800">
            {isCompleted
              ? 'Appraisal Cycle Completed'
              : isSubmittedOrLocked
              ? 'Self-Assessment Submitted (Under Review)'
              : 'Self-Assessment In Progress'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {!isSubmittedOrLocked ? (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={submitting}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2 shadow-2xs"
              >
                <Save size={16} />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(true)}
                disabled={submitting}
                className="px-8 py-3 bg-[#1ea855] hover:bg-[#188c46] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all flex items-center space-x-2"
              >
                <Send size={16} />
                <span>Submit Self Review</span>
              </button>
            </>
          ) : isCompleted ? (
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-100 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <span>✓ Review Completed</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs sm:text-sm font-bold">
              <CheckCircle2 size={18} className="text-blue-600" />
              <span>✓ Self Review Submitted</span>
            </div>
          )}
        </div>
      </div>

      {/* 6. KPI DETAILS MODAL */}
      {selectedKpiForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center font-bold">
                  <Target size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-800">KPI Objective Details</h3>
              </div>
              <button
                onClick={() => setSelectedKpiForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KPI Name</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">{selectedKpiForModal.kpiName}</h4>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description / Measurement Criteria
                </span>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {selectedKpiForModal.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weightage</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">{selectedKpiForModal.weightage}%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Self Rating</span>
                  <span className="text-lg font-black text-[#1ea855] mt-1 block">
                    {ratings[selectedKpiForModal.kpiId]?.rating !== ''
                      ? `${ratings[selectedKpiForModal.kpiId]?.rating} / 5.0`
                      : 'Not Rated'}
                  </span>
                </div>
              </div>

              {/* Rating Scale Guide */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating Scale Guide</span>
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 w-8">1.0</span>
                    <span>Needs Significant Improvement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 w-8">2.0</span>
                    <span>Needs Improvement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 w-8">3.0</span>
                    <span>Meets Expectations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 w-8">4.0</span>
                    <span>Exceeds Expectations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 w-8">5.0</span>
                    <span>Outstanding</span>
                  </div>
                </div>
              </div>

              {/* Self Comments in Modal */}
              {ratings[selectedKpiForModal.kpiId]?.comments && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Self Comments</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mt-1">
                    {ratings[selectedKpiForModal.kpiId]?.comments}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedKpiForModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM SUBMISSION MODAL */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/80 shadow-2xs">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Submit Self Review?</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Are you sure you want to submit your Self Assessment? Once submitted, your ratings and comments will be locked for review.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 bg-[#1ea855] hover:bg-[#188c46] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 transition-all"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMyKpisPage;
