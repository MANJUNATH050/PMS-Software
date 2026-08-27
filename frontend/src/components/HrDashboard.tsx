import React, { useState, useEffect } from 'react';
import aseuroLogo from '../assets/aseuro-logo.png';
import type { AuthUser, Department, Designation, ManagerOption, EmployeeRecord, UserRole } from '../types';

interface HrDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'provision' | 'directory' | 'kpi' | 'lifecycle' | 'reports'>('provision');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Provisioning Form State
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designationId, setDesignationId] = useState<number | ''>('');
  const [managerId, setManagerId] = useState<number | ''>('');
  const [joiningDate, setJoiningDate] = useState('2026-08-26');
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${user.token}` };

      const [deptRes, desigRes, mgrRes, empRes] = await Promise.all([
        fetch('/api/hr/departments', { headers }),
        fetch('/api/hr/designations', { headers }),
        fetch('/api/hr/managers', { headers }),
        fetch('/api/hr/employees', { headers }),
      ]);

      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
      }
      if (desigRes.ok) {
        const desigs = await desigRes.json();
        setDesignations(desigs);
        if (desigs.length > 0 && !designationId) setDesignationId(desigs[0].id);
      }
      if (mgrRes.ok) setManagers(await mgrRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) {
      console.error('Error loading HR data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, [user.token]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!fullName.trim() || !employeeCode.trim() || !email.trim() || !password.trim() || !departmentId || !designationId) {
      setFormMsg({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          employeeCode: employeeCode.trim(),
          email: email.trim(),
          password: password,
          role: role,
          departmentId: Number(departmentId),
          designationId: Number(designationId),
          managerId: managerId ? Number(managerId) : null,
          joiningDate: joiningDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create account.');
      }

      setFormMsg({
        type: 'success',
        text: `Successfully created ${role} account for ${fullName} (${email})! They can now log in.`,
      });

      // Clear form
      setFullName('');
      setEmployeeCode('');
      setEmail('');
      setPassword('Password@123');
      setManagerId('');

      // Refresh directory and manager lists
      fetchMasterData();
    } catch (err) {
      setFormMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error creating employee credentials.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="dashboard-navbar">
        <div className="nav-brand">
          <img src={aseuroLogo} alt="Aseuro Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="brand-name">aseuro</span>
          <span className="portal-badge hr">HR Portal</span>
        </div>

        <div className="nav-user">
          <div className="user-details">
            <span className="user-name">{user.fullName}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout ⎋
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="dashboard-container">
        {/* Navigation Tabs */}
        <div className="tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'provision' ? 'active' : ''}`}
            onClick={() => setActiveTab('provision')}
          >
            👤 Add Employees & Managers
          </button>
          <button
            className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            📋 Employee Directory ({employees.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            🎯 Add/Edit KPIs
          </button>
          <button
            className={`tab-btn ${activeTab === 'lifecycle' ? 'active' : ''}`}
            onClick={() => setActiveTab('lifecycle')}
          >
            🔄 PMS Lifecycle
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📊 Generate Reports
          </button>
        </div>

        {/* Tab 1: Provisioning Form */}
        {activeTab === 'provision' && (
          <div className="tab-content">
            <div className="card-header">
              <h3>Create Credentials & Setup Profiles</h3>
              <p>
                Provision new employees and managers. Their login credentials will be stored in PostgreSQL and validated dynamically upon sign in.
              </p>
            </div>

            {formMsg && (
              <div className={`status-banner ${formMsg.type}`}>
                {formMsg.type === 'success' ? '✓ ' : '⚠ '}
                {formMsg.text}
              </div>
            )}

            <form className="provision-form" onSubmit={handleCreateEmployee}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Employee Code / ID *</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="e.g. EMP-105 or MGR-103"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Work Email (Login Username) *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya.nair@aseuro.in"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Initial Password (Min 8 chars, letters, numbers, symbols) *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Password@123"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>User Role *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} required>
                    <option value="EMPLOYEE">EMPLOYEE (Standard Self-Review)</option>
                    <option value="MANAGER">MANAGER (Reviewer & Team Lead)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    required
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation *</label>
                  <select
                    value={designationId}
                    onChange={(e) => setDesignationId(Number(e.target.value))}
                    required
                  >
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reporting Manager {role === 'EMPLOYEE' ? '(Mandatory for Employee)' : '(Optional)'}</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Select Reporting Manager --</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.employeeCode}) - {m.designationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Joining Date *</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Credentials...' : 'Create Credentials & Save to Database'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Directory Table */}
        {activeTab === 'directory' && (
          <div className="tab-content">
            <div className="directory-header">
              <div>
                <h3>Database Registered Users & Profiles</h3>
                <p>View all accounts currently authenticated against PostgreSQL</p>
              </div>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by name, email, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading users from PostgreSQL...</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Full Name</th>
                      <th>Email (Login)</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Reporting Manager</th>
                      <th>Joining Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td><strong>{emp.employeeCode}</strong></td>
                        <td>{emp.fullName}</td>
                        <td><code>{emp.email}</code></td>
                        <td>
                          <span className={`role-chip ${emp.role.toLowerCase()}`}>{emp.role}</span>
                        </td>
                        <td>{emp.departmentName}</td>
                        <td>{emp.designationName}</td>
                        <td>{emp.managerName || '—'}</td>
                        <td>{emp.joiningDate}</td>
                        <td>
                          <span className="status-badge active">{emp.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: KPI Master (Teammate Placeholder) */}
        {activeTab === 'kpi' && (
          <div className="tab-content">
            <div className="card-header">
              <h3>KPI Master & Role-Based Weightages</h3>
              <p>Configure KPIs for designations (Teammates module integration point)</p>
            </div>
            <div className="placeholder-box">
              <div className="placeholder-icon">🎯</div>
              <h4>KPI Master Architecture Ready</h4>
              <p>
                Designation and KPI tables are mapped in the PostgreSQL schema. HR can assign KPIs up to 100% weightage per role.
              </p>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-num">{designations.length}</span>
                  <span className="stat-label">Active Designations</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{departments.length}</span>
                  <span className="stat-label">Departments</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: PMS Lifecycle (Teammate Placeholder) */}
        {activeTab === 'lifecycle' && (
          <div className="tab-content">
            <div className="card-header">
              <h3>Employee PMS Lifecycle</h3>
              <p>Centralized view of Self Ratings, Manager Ratings, and Final HR Score approval</p>
            </div>
            <div className="placeholder-box">
              <div className="placeholder-icon">🔄</div>
              <h4>PMS Workflow Active</h4>
              <p>
                HR Setup ➔ Employee Self-Review ➔ Manager Review ➔ HR Final Marks ➔ Publish Final Result
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Reports */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            <div className="card-header">
              <h3>Generate Performance Reports</h3>
              <p>Export individual employee, manager, and team performance analytics</p>
            </div>
            <div className="placeholder-box">
              <div className="placeholder-icon">📊</div>
              <h4>Reporting Views Mapped</h4>
              <p>PostgreSQL views <code>v_hr_individual_report</code> and <code>v_pms_report_detail</code> are ready.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
