import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pmsApi } from '../api/pmsApi';
import { DashboardData, PmsAssignment } from '../types';
import { Timeline } from '../components/Timeline';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  CheckCircle,
  FileCheck,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<PmsAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      pmsApi.getDashboard(),
      pmsApi.getCurrentAssignment()
    ])
      .then(([dashResult, assignResult]) => {
        if (dashResult.status === 'fulfilled') {
          setData(dashResult.value);
        } else {
          console.error(dashResult.reason);
          setError('Unable to load dashboard details. Please check your connections.');
        }

        if (assignResult.status === 'fulfilled') {
          setCurrentAssignment(assignResult.value);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load dashboard details. Please check your connections.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 h-32 space-y-3 shadow-sm">
              <div className="h-4 bg-slate-200 rounded w-2/3 skeleton-shimmer"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2 skeleton-shimmer"></div>
            </div>
          ))}
        </div>
        {/* Timeline Skeleton */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-64 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertTriangle className="text-amber-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">System Error</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Something went wrong.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm shadow transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle empty state if no active cycle
  if (data.currentCycle === 'N/A' || data.pmsStatus === 'PMS_NOT_STARTED') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto mt-12 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Calendar size={32} />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">No Active PMS Cycle</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          There is currently no active performance management cycle assigned to you. When HR starts the next cycle, it will appear here.
        </p>
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-pms-green hover:text-pms-darkGreen transition-colors"
        >
          <span>View finalized reports</span>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const completionPct = data.totalKpis > 0 ? Math.round((data.completedKpis / data.totalKpis) * 100) : 0;
  const isSelfAssessmentOpen = data.pmsStatus === 'PMS_STARTED' || data.pmsStatus === 'SELF_ASSESSMENT_DRAFT';

  // Calculate dynamic self-assessment rating from rated KPIs
  let calculatedSelfRating: number | null = null;
  if (currentAssignment && currentAssignment.kpis && currentAssignment.kpis.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;
    let hasRating = false;

    currentAssignment.kpis.forEach((kpi) => {
      if (kpi.selfRating !== null && kpi.selfRating !== undefined) {
        hasRating = true;
        weightedSum += kpi.selfRating * kpi.weightage;
        totalWeight += kpi.weightage;
      }
    });

    if (hasRating && totalWeight > 0) {
      calculatedSelfRating = weightedSum / totalWeight;
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-pms-gray">Active Appraisal Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and complete your performance evaluation milestones.
          </p>
        </div>
        <div>
          <StatusBadge status={data.pmsStatus} />
        </div>
      </div>

      {/* Action Banner if action needed */}
      {isSelfAssessmentOpen && (
        <div className="bg-pms-lightGreen border border-pms-green/20 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-lg text-pms-green border border-pms-green/10 shadow-sm shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-pms-darkGreen">Action Required: Self-Assessment Pending</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                You have completed {data.completedKpis} of your {data.totalKpis} assigned KPIs ({completionPct}%). Please submit before the deadline.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/kpis')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <span>Start Assessment</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Dashboard Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Active Cycle */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Cycle</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">{data.currentCycle}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Self Evaluation Period</p>
          </div>
        </div>

        {/* Card 2: Self Assessment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Self Assessment</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">
              {calculatedSelfRating !== null ? `${calculatedSelfRating.toFixed(2)} / 5.00` : 'Pending'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {data.completedKpis} / {data.totalKpis} KPIs Rated
            </p>
          </div>
        </div>

        {/* Card 3: Manager Review Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manager Review</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">{data.managerReviewStatus}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting Manager Remarks</p>
          </div>
        </div>

        {/* Card 4: Latest Performance Finalized */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-slate-50 rounded-lg text-pms-gray border border-slate-100 shadow-inner">
            <Award size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Finalized Score</p>
            <h3 className="text-lg font-bold text-pms-gray mt-1">
              {data.latestFinalizedScore !== null ? `${data.latestFinalizedScore.toFixed(2)} / 5.00` : 'N/A'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {data.latestFinalizedGrade || 'No finalized grades yet'}
            </p>
          </div>
        </div>

      </div>

      {/* Status Stepper Tracker */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-pms-gray">Appraisal Workflow Tracking</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current cycle progression checkpoint</p>
          </div>
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 shadow-xs self-start sm:self-auto">
            Deadline: 10 Sept 2026
          </span>
        </div>
        <Timeline status={data.pmsStatus} />
      </div>

      {/* Action / Next steps detail */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-pms-gray mb-4">Assessment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Assessment Status</h4>
            <p className="text-xs text-slate-500 mt-2">{data.actionRequired}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Weighted KPIs</h4>
            <p className="text-xs text-slate-500 mt-2">
              Your self-assessment progress accounts for <strong className="text-pms-darkGreen font-semibold">{data.completedWeightage}%</strong> of your total KPI weights. Complete ratings to reach 100%.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-pms-gray uppercase tracking-wider">Self Assessment Link</h4>
              <p className="text-xs text-slate-500 mt-2">Click to review individual KPI descriptors.</p>
            </div>
            <button
              onClick={() => navigate('/kpis')}
              className="text-xs font-semibold text-pms-green hover:text-pms-darkGreen flex items-center space-x-1 mt-4 group"
            >
              <span>Go to My KPIs</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Dashboard;
