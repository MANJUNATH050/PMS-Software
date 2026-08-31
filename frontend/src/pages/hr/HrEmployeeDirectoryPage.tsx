import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrApi } from '../../api/hrApi';
import { EmployeeRecord, Designation, ManagerOption } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  Building,
  UserCheck,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
  Briefcase,
  Shield,
  Mail,
  User
} from 'lucide-react';

export const HrEmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [formRole, setFormRole] = useState('EMPLOYEE');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDepartment, setFormDepartment] = useState('Engineering');
  const [formTeam, setFormTeam] = useState('Core Team');
  const [formManagerId, setFormManagerId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchEmployees = () => {
    setLoading(true);
    hrApi.getEmployees()
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();

    hrApi.getDesignations()
      .then((data) => {
        const filtered = data.filter(d => d.name !== 'ALL' && d.name !== 'GLOBAL');
        setDesignations(filtered);
      })
      .catch((err) => console.error('Failed to load designations', err));

    hrApi.getManagers()
      .then((data) => setManagers(data))
      .catch((err) => console.error('Failed to load managers', err));
  }, []);

  const handleOpenEditModal = (emp: EmployeeRecord) => {
    setEditingEmployee(emp);
    const cleanRole = (emp.role || 'EMPLOYEE').replace('ROLE_', '').toUpperCase();
    setFormRole(cleanRole);
    setFormDesignation(emp.designation || emp.designationName || 'Software Engineer');
    setFormDepartment(emp.department || emp.departmentName || 'Engineering');
    setFormTeam(emp.team || 'Core Team');
    setFormManagerId(emp.managerId ?? null);
    setFormStatus(emp.accountStatus || emp.status || 'ACTIVE');
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setModalError(null);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!formDesignation.trim()) {
      setModalError('Designation is required.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      await hrApi.updateEmployee(editingEmployee.id, {
        role: formRole,
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        team: formTeam.trim(),
        managerId: formManagerId,
        accountStatus: formStatus
      });

      setSuccess('Employee details updated successfully.');
      setTimeout(() => setSuccess(null), 4000);
      handleCloseEditModal();
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setIsSaving(false);
    }
  };

  const originalRole = editingEmployee ? (editingEmployee.role || 'EMPLOYEE').replace('ROLE_', '').toUpperCase() : '';
  const isRoleChanged = originalRole && formRole !== originalRole;

  const filtered = employees.filter((e) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (e.name || e.fullName || '').toLowerCase().includes(q);
    const emailMatch = (e.email || '').toLowerCase().includes(q);
    const codeMatch = (e.employeeCode || '').toLowerCase().includes(q);
    const desigMatch = (e.designation || e.designationName || '').toLowerCase().includes(q);
    const roleMatch = roleFilter === 'ALL' || (e.role && e.role.toUpperCase().includes(roleFilter));

    return (nameMatch || emailMatch || codeMatch || desigMatch) && roleMatch;
  });

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
          <h2 className="text-2xl font-bold text-pms-gray">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered corporate staff authenticated against PostgreSQL.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hr/employees/add')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="bg-pms-lightGreen border-l-4 border-pms-green p-4 rounded-xl flex items-center space-x-3 text-xs text-pms-darkGreen font-bold animate-slideIn">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center space-x-3 text-xs text-red-700 font-bold animate-slideIn">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search employees by name, email, ID code, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50"
          >
            <option value="ALL">All Roles</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="MANAGER">Managers</option>
            <option value="HR">HR Admins</option>
          </select>
          <button
            onClick={fetchEmployees}
            title="Refresh List"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading employee directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No employees found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Code / ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Employee Details</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Designation</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Department</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Reporting Manager</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-extrabold text-pms-gray">
                      {emp.employeeCode || `EMP-${emp.id}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-pms-gray">{emp.name || emp.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (emp.role || '').toUpperCase().includes('HR')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : (emp.role || '').toUpperCase().includes('MANAGER')
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {(emp.role || 'EMPLOYEE').replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                      {emp.designation || emp.designationName || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {emp.department || emp.departmentName || 'Engineering'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                      {emp.managerName || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pms-lightGreen text-pms-darkGreen border border-pms-green/20">
                        {emp.accountStatus || emp.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                        title={`Edit ${emp.name || emp.fullName}`}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-pms-lightGreen text-pms-green flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-pms-gray">Edit Employee</h3>
                  <p className="text-[11px] text-slate-500">Update corporate role, designation, and reporting details</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEmployee}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Read-Only Profile Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-pms-green text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(editingEmployee.name || editingEmployee.fullName || 'E').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-pms-gray truncate">
                      {editingEmployee.name || editingEmployee.fullName}
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-slate-700">
                        {editingEmployee.employeeCode || `EMP-${editingEmployee.id}`}
                      </span>
                      <span>•</span>
                      <span className="truncate">{editingEmployee.email}</span>
                    </div>
                  </div>
                </div>

                {/* Role Change Warning */}
                {isRoleChanged && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Role Permission Change Notice</p>
                      <p className="text-[11px] mt-0.5 text-amber-700">
                        Changing role from <strong className="font-bold">{originalRole}</strong> to <strong className="font-bold">{formRole}</strong> updates application navigation, evaluation access, and security authorization for this user.
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role Dropdown */}
                  <div>
                    <label htmlFor="edit-employee-role" className="block text-xs font-bold text-pms-gray mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit-employee-role"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label htmlFor="edit-employee-status" className="block text-xs font-bold text-pms-gray mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit-employee-status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Designation Dropdown */}
                <div>
                  <label htmlFor="edit-employee-designation" className="block text-xs font-bold text-pms-gray mb-1">
                    Designation / Title <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-employee-designation"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    {!designations.some(d => d.name === formDesignation) && formDesignation && (
                      <option value={formDesignation}>{formDesignation}</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Future PMS cycles will automatically inherit the KPIs assigned to this designation.
                  </p>
                </div>

                {/* Department & Team */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-employee-department" className="block text-xs font-bold text-pms-gray mb-1">Department</label>
                    <select
                      id="edit-employee-department"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Product">Product</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-employee-team" className="block text-xs font-bold text-pms-gray mb-1">Team</label>
                    <input
                      id="edit-employee-team"
                      type="text"
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      placeholder="e.g. Core Team"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                    />
                  </div>
                </div>

                {/* Reporting Manager */}
                <div>
                  <label htmlFor="edit-employee-manager" className="block text-xs font-bold text-pms-gray mb-1">Reporting Manager</label>
                  <select
                    id="edit-employee-manager"
                    value={formManagerId ?? ''}
                    onChange={(e) => setFormManagerId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-pms-gray focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green"
                  >
                    <option value="">No Reporting Manager</option>
                    {managers
                      .filter((m) => m.id !== editingEmployee.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.designationName || 'Manager'}) - {m.email}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Existing reporting hierarchy is preserved unless explicitly modified.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-5 py-2 bg-pms-green hover:bg-pms-darkGreen text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HrEmployeeDirectoryPage;

