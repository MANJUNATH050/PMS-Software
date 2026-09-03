import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { Designation, KpiMasterItem } from '../../types';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Users,
  Briefcase,
  Award,
  Layers
} from 'lucide-react';

import { RatingScaleLegend } from '../../components/RatingScaleLegend';

export const HrKpisPage: React.FC = () => {
  const navigate = useNavigate();
  const [kpiCategory, setKpiCategory] = useState<'ROLE_KPI' | 'HR_REVIEW_KPI'>('ROLE_KPI');
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [kpis, setKpis] = useState<KpiMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKpiId, setCurrentKpiId] = useState<number | null>(null);
  const [formKpiName, setFormKpiName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWeightage, setFormWeightage] = useState<number>(20);
  const [formApplicableFor, setFormApplicableFor] = useState<'Employee' | 'Manager' | 'Both Employee & Manager'>('Employee');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hrApi.getDesignations()
      .then((data) => {
        const filtered = data.filter(d => d.name !== 'ALL' && d.name !== 'GLOBAL');
        setDesignations(filtered);
        if (filtered.length > 0) {
          setSelectedDesignation(filtered[0].name);
          loadKpis(filtered[0].name, kpiCategory);
        } else {
          loadKpis('', kpiCategory);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load designations.');
        setLoading(false);
      });
  }, []);

  const loadKpis = (desig: string, category: 'ROLE_KPI' | 'HR_REVIEW_KPI') => {
    setLoading(true);
    setError(null);
    const designationParam = category === 'ROLE_KPI' ? desig : undefined;
    hrApi.getKpiMasterList(designationParam, category)
      .then((data) => {
        setKpis(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load KPIs.');
        setLoading(false);
      });
  };

  const handleCategorySwitch = (newCategory: 'ROLE_KPI' | 'HR_REVIEW_KPI') => {
    setKpiCategory(newCategory);
    loadKpis(selectedDesignation, newCategory);
  };

  const handleDesignationChange = (newDesig: string) => {
    setSelectedDesignation(newDesig);
    loadKpis(newDesig, kpiCategory);
  };

  const totalWeightage = kpis.reduce((sum, k) => sum + k.weightage, 0);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentKpiId(null);
    setFormKpiName('');
    setFormDescription('');
    const remainingWeight = Math.max(5, 100 - totalWeightage);
    setFormWeightage(remainingWeight);
    setFormApplicableFor('Employee');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (kpi: KpiMasterItem) => {
    setModalMode('edit');
    setCurrentKpiId(kpi.id);
    setFormKpiName(kpi.kpiName);
    setFormDescription(kpi.description || '');
    setFormWeightage(kpi.weightage);
    const app = kpi.applicableFor;
    if (app === 'Manager' || app === 'Both Employee & Manager' || app === 'Employee') {
      setFormApplicableFor(app as any);
    } else {
      setFormApplicableFor('Employee');
    }
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setError(null);

    if (!formKpiName.trim()) {
      setFormError('KPI Name is required.');
      return;
    }

    if (!formWeightage || formWeightage <= 0) {
      setFormError('Weightage must be greater than 0%.');
      return;
    }

    // Validate 100% limit
    const otherKpisWeight = modalMode === 'edit'
      ? kpis.filter(k => k.id !== currentKpiId).reduce((sum, k) => sum + k.weightage, 0)
      : totalWeightage;

    if (otherKpisWeight + formWeightage > 100.0) {
      setFormError(`Total ${kpiCategory === 'HR_REVIEW_KPI' ? 'HR Review ' : ''}KPI weightage cannot exceed 100%. (Current remaining: ${100 - otherKpisWeight}%, Attempted: ${formWeightage}%)`);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await hrApi.createKpi({
          designation: kpiCategory === 'ROLE_KPI' ? selectedDesignation : 'ALL',
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage,
          applicableFor: kpiCategory === 'ROLE_KPI' ? formApplicableFor : 'Both Employee & Manager',
          kpiCategory: kpiCategory
        });
        setSuccess(`KPI "${formKpiName}" created successfully.`);
      } else if (currentKpiId) {
        await hrApi.updateKpi(currentKpiId, {
          kpiName: formKpiName.trim(),
          description: formDescription.trim(),
          weightage: formWeightage,
          applicableFor: kpiCategory === 'ROLE_KPI' ? formApplicableFor : 'Both Employee & Manager',
          kpiCategory: kpiCategory
        });
        setSuccess(`KPI "${formKpiName}" updated successfully.`);
      }

      setModalOpen(false);
      loadKpis(selectedDesignation, kpiCategory);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save KPI.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKpi = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the KPI "${name}"?`)) {
      return;
    }
    try {
      await hrApi.deleteKpi(id);
      setSuccess(`KPI "${name}" deleted successfully.`);
      loadKpis(selectedDesignation, kpiCategory);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete KPI.');
    }
  };

  const getApplicableBadge = (app?: string) => {
    const val = app || 'Employee';
    if (val === 'Manager') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
          <Briefcase size={11} className="mr-1" />
          Manager
        </span>
      );
    }
    if (val === 'Both Employee & Manager' || val === 'Both') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
          <Users size={11} className="mr-1" />
          Both Employee & Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Users size={11} className="mr-1" />
        Employee
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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
          <h2 className="text-2xl font-bold text-pms-gray">KPI Master Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Role-based KPIs and global HR Review KPIs, enforce 100% total weightage limits.
          </p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
            title="Add New KPI"
          >
            <Plus size={16} />
            <span>Add New KPI</span>
          </button>
        </div>
      </div>

      <RatingScaleLegend className="my-2" />

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

      {/* KPI Category Toggle Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Layers size={18} className="text-pms-green" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">KPI Type:</span>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleCategorySwitch('ROLE_KPI')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              kpiCategory === 'ROLE_KPI'
                ? 'bg-white text-pms-darkGreen shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={14} />
            <span>Role / Manager KPIs</span>
          </button>
          <button
            type="button"
            onClick={() => handleCategorySwitch('HR_REVIEW_KPI')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              kpiCategory === 'HR_REVIEW_KPI'
                ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award size={14} />
            <span>HR Review KPIs (All Staff)</span>
          </button>
        </div>
      </div>

      {/* Designation Selection & Weightage Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        {kpiCategory === 'ROLE_KPI' ? (
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Role / Designation:
            </label>
            <select
              value={selectedDesignation}
              onChange={(e) => handleDesignationChange(e.target.value)}
              className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
            >
              {designations.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex-1 max-w-md">
            <span className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
              Global HR Review KPIs
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              These 5 HR KPIs apply to <strong>every employee</strong> across all designations. HR rates staff on these competencies during the HR Review stage.
            </p>
          </div>
        )}

        {/* Dynamic Weightage & Remaining Status Bar */}
        <div className="flex-1 md:max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {kpiCategory === 'HR_REVIEW_KPI' ? 'HR Review Weightage' : 'Role Weightage Allocated'}
              </span>
              <span className={`text-base font-extrabold ${totalWeightage === 100 ? 'text-pms-darkGreen' : totalWeightage > 100 ? 'text-rose-600' : 'text-amber-700'}`}>
                {totalWeightage}% <span className="text-xs font-normal text-slate-400">/ 100%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
              <span className="text-base font-extrabold text-slate-700">
                {Math.max(0, 100 - totalWeightage)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalWeightage === 100 ? 'bg-pms-green' : totalWeightage > 100 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(totalWeightage, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              totalWeightage === 100
                ? 'bg-emerald-100 text-emerald-800'
                : totalWeightage > 100
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {totalWeightage === 100
                ? 'Status: Fully Allocated (100%)'
                : totalWeightage > 100
                ? `Status: Over-Allocated (${totalWeightage - 100}% Excess)`
                : `Status: ${100 - totalWeightage}% Remaining`}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Max Limit: 100.0%</span>
          </div>
        </div>
      </div>

      {/* Mapped KPI Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target size={18} className="text-pms-green" />
            <h3 className="text-sm font-bold text-pms-gray">
              {kpiCategory === 'HR_REVIEW_KPI' ? (
                <span>Global HR Review KPI Master List (All Employees)</span>
              ) : (
                <span>Role KPI Master List for <strong className="text-pms-darkGreen">"{selectedDesignation}"</strong></span>
              )}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {kpis.length} Active KPI{kpis.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading KPIs...</div>
        ) : kpis.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No KPIs configured for this category. Click "+ Add KPI" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase">#</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase">
                    {kpiCategory === 'HR_REVIEW_KPI' ? 'HR Review KPI' : 'KPI Name'}
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase">Measurement Criteria</th>
                  {kpiCategory === 'ROLE_KPI' && (
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Applicable For</th>
                  )}
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">
                    {kpiCategory === 'HR_REVIEW_KPI' ? 'HR Rating Scale' : 'Rating Scale'}
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Weightage</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {kpis.map((kpi, idx) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-4 text-xs font-bold text-pms-gray">{kpi.kpiName}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 max-w-md">{kpi.description}</td>
                    {kpiCategory === 'ROLE_KPI' && (
                      <td className="px-4 py-4 text-xs text-center">{getApplicableBadge(kpi.applicableFor)}</td>
                    )}
                    <td className="px-4 py-4 text-xs text-center text-slate-500 font-medium">1.0 - 5.0</td>
                    <td className="px-4 py-4 text-xs font-extrabold text-pms-darkGreen text-center">
                      <span className="px-2.5 py-1 rounded-full bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20">
                        {kpi.weightage}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(kpi)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit KPI"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteKpi(kpi.id, kpi.kpiName)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete KPI"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit KPI Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-pms-gray">
                {modalMode === 'create'
                  ? (kpiCategory === 'HR_REVIEW_KPI' ? 'Add Global HR Review KPI' : `Add Role KPI for ${selectedDesignation}`)
                  : `Edit KPI: ${formKpiName}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg text-xs text-rose-800 font-semibold flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveKpi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  KPI Name *
                </label>
                <input
                  type="text"
                  required
                  value={formKpiName}
                  onChange={(e) => setFormKpiName(e.target.value)}
                  placeholder={kpiCategory === 'HR_REVIEW_KPI' ? 'e.g. Leave Pattern, Punctuality' : 'e.g. Code Quality & Test Coverage'}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Measurement Criteria / Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe measurable targets, deliverables, and expectations..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                />
              </div>

              {/* Rating Scale Indicator */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating Scale</span>
                <span className="text-xs font-extrabold text-pms-darkGreen">1.0 - 5.0 (Standard Evaluation Scale)</span>
              </div>

              {/* Applicable For Selector (Only for Role KPIs) */}
              {kpiCategory === 'ROLE_KPI' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Applicable For *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormApplicableFor('Employee')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        formApplicableFor === 'Employee'
                          ? 'bg-pms-lightGreen text-pms-darkGreen border-pms-green/50 ring-2 ring-pms-green/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormApplicableFor('Manager')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        formApplicableFor === 'Manager'
                          ? 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormApplicableFor('Both Employee & Manager')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        formApplicableFor === 'Both Employee & Manager'
                          ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Both Employee & Manager
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Weightage Percentage (1% - 100%) *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="100"
                    required
                    value={formWeightage}
                    onChange={(e) => setFormWeightage(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    %
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total {kpiCategory === 'HR_REVIEW_KPI' ? 'HR Review ' : ''}weightage cannot exceed 100%.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save KPI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrKpisPage;
