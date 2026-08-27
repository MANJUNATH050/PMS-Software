import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import KpiManagement from './components/KpiManagement';
import ManagerManagement from './components/ManagerManagement';
import GenerateReports from './components/GenerateReports';
import PmsLifecycle from './components/PmsLifecycle';

import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard as EmpDashboard } from './pages/Dashboard';
import { MyKpis } from './pages/MyKpis';
import { MyReports } from './pages/MyReports';
import { Profile } from './pages/Profile';
import { PmsHistoryPage } from './pages/PmsHistoryPage';
import { HistoryDetail } from './pages/HistoryDetail';

function EmployeeShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

import {
  createEmployee,
  getDashboardActivity,
  getDashboardSummary,
  getLookups,
} from './services/hrService';

import { login } from './services/authService';

import './App.css';

const emptyEmployee = {
  fullName: '',
  employeeCode: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  departmentId: '',
  teamId: '',
  designationId: '',
  managerId: '',
  joiningDate: '',
  status: 'ACTIVE',
};

function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          PMS<span>.</span>
        </div>

        <p className="portal-label">HR PORTAL</p>

        <nav className="nav-links">
          <Link
            to="/hr/dashboard"
            className={`nav-item ${location.pathname === '/hr/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/hr/employees/add"
            className={`nav-item ${location.pathname === '/hr/employees/add' ? 'active' : ''}`}
          >
            Add Employees
          </Link>
          <Link
            to="/hr/kpis"
            className={`nav-item ${location.pathname === '/hr/kpis' ? 'active' : ''}`}
          >
            KPI Management
          </Link>
          <Link
            to="/hr/managers"
            className={`nav-item ${location.pathname === '/hr/managers' ? 'active' : ''}`}
          >
            Add/Edit Managers
          </Link>
          <Link
            to="/hr/reports"
            className={`nav-item ${location.pathname === '/hr/reports' ? 'active' : ''}`}
          >
            Generate Reports
          </Link>
          <Link
            to="/hr/pms-lifecycle"
            className={`nav-item ${location.pathname === '/hr/pms-lifecycle' ? 'active' : ''}`}
          >
            PMS Lifecycle
          </Link>
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            signOut();
            navigate('/login');
          }}
        >
          Log out <span>-&gt;</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="crumb">
            PMS <span>/</span> HR Workspace
          </div>

          <div className="profile">
            <div className="avatar">
              {user?.name?.slice(0, 1) || 'H'}
            </div>

            <div className="profile-info">
              <strong>{user?.name || 'HR User'}</strong>
              <small>Human Resources</small>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}



function Dashboard() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(false);

    try {
      const [
        summaryResponse,
        activityResponse,
      ] = await Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
      ]);

      setSummary(summaryResponse.data);
      setActivity(activityResponse.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = [
    ['Total employees', 'totalEmployees'],
    ['Active employees', 'activeEmployees'],
    ['New employees', 'newEmployees'],
    ['Pending reviews', 'pendingReviews'],
  ];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>

          <h1>HR Dashboard</h1>

          <p className="muted">
            Welcome back, {user?.name || 'HR User'}.
            Here is your people overview.
          </p>
        </div>

        <Link
          className="primary-btn compact"
          to="/hr/employees/add"
        >
          <span>+</span> Add employee
        </Link>
      </div>

      {error && (
        <div className="alert error dashboard-alert">
          Unable to load dashboard information.

          <button onClick={load}>Retry</button>
        </div>
      )}

      <div className="stats-grid">
        {stats.map(([label, key]) => (
          <div className="stat-card" key={key}>
            {loading ? (
              <div className="skeleton value" />
            ) : (
              <strong>{summary?.[key] ?? '-'}</strong>
            )}

            <span>{label}</span>

            <i
              className={`stat-dot dot-${key}`}
            />
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel activity-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">LIVE FEED</p>
              <h2>Recent activity</h2>
            </div>

            <span className="status-live">
              ● Live
            </span>
          </div>

          {loading ? (
            <div className="activity-loading">
              Loading activity...
            </div>
          ) : activity.length ? (
            activity.map((item, index) => (
              <div
                className="activity-item"
                key={item.id || index}
              >
                <div className="activity-icon">
                  {item.action?.includes('created')
                    ? '+'
                    : '->'}
                </div>

                <div>
                  <strong>
                    {item.message ||
                      `Employee ${item.employeeCode} ${item.action}`}
                  </strong>

                  <span>
                    {item.createdAt || 'Recently'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No recent activity to display.
            </div>
          )}
        </div>

        <div className="panel action-panel">
          <p className="eyebrow">QUICK ACTION</p>

          <h2>Keep things moving</h2>

          <p className="muted">
            Add a new profile to keep your people
            data current.
          </p>

          <Link
            className="outline-btn"
            to="/hr/employees/add"
          >
            Add an employee <span>-&gt;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function AddEmployee() {
  const navigate = useNavigate();

  const defaultDepartments = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Human Resources' },
  { id: 3, name: 'Finance' },
];

const defaultTeams = [
  { id: 1, name: 'Development Team' },
  { id: 2, name: 'Devops Team' },
  { id: 3, name: 'HR Team' },
];

const defaultDesignations = [
  { id: 1, name: 'Software Engineer' },
  { id: 2, name: 'HR Executive' },
  { id: 3, name: 'Manager' },
];

const defaultManagers = [
  {
    id: 1,
    employeeCode: 'MGR001',
    fullName: 'Arun Kumar',
  },
  {
    id: 2,
    employeeCode: 'MGR002',
    fullName: 'Priya Sharma',
  },
  {
    id: 3,
    employeeCode: 'MGR003',
    fullName: 'Rahul Kumar',
  },
];

  const [form, setForm] = useState(emptyEmployee);

  // const [lookups, setLookups] = useState({
  //   departments: [],
  //   teams: [],
  //   designations: [],
  //   managers: [],
  // });

  const [lookups, setLookups] = useState({
  departments: defaultDepartments,
  teams: defaultTeams,
  designations: defaultDesignations,
  managers: defaultManagers,
});

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   getLookups()
  //     .then(
  //       ([
  //         departments,
  //         teams,
  //         designations,
  //         managers,
  //       ]) =>
  //         setLookups({
  //           departments: departments.data,
  //           teams: teams.data,
  //           designations: designations.data,
  //           managers: managers.data,
  //         })
  //     )
  //     .catch(() => {});
  // }, []);

  const update = (name, value) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    const next = {};

    if (!form.fullName.trim()) {
      next.fullName = 'Employee name is required.';
    }

    if (!form.employeeCode.trim()) {
      next.employeeCode = 'Employee ID is required.';
    }

    if (!form.email.match(/^\S+@\S+\.\S+$/)) {
      next.email =
        'Please enter a valid email address.';
    }

    if (!form.password || form.password.length < 4) {
      next.password =
        'Password is required (min 4 characters).';
    }

    if (!form.departmentId) {
      next.departmentId =
        'Please select a department.';
    }

    if (!form.designationId) {
      next.designationId =
        'Please select a designation.';
    }

    if (!form.managerId) {
      next.managerId =
        'Please select a reporting manager.';
    }

    if (!form.joiningDate) {
      next.joiningDate =
        'Joining date is required.';
    }

    setErrors(next);

    if (Object.keys(next).length) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await createEmployee({
        ...form,
        departmentId: Number(form.departmentId),
        teamId: form.teamId
          ? Number(form.teamId)
          : null,
        designationId: Number(form.designationId),
        managerId: Number(form.managerId),
      });

      setMessage(
        'Employee created successfully.'
      );

      setForm(emptyEmployee);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          'Unable to create employee. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label,
    name,
    type = 'text',
    extra = {}
  ) => (
    <label>
      {label}

      {type === 'select' ? (
        <select
          value={form[name]}
          onChange={(e) =>
            update(name, e.target.value)
          }
        >
          <option value="">
            Select {label.toLowerCase()}
          </option>

          {extra.options?.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.name ||
                `${item.employeeCode} - ${item.fullName}`}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) =>
            update(name, e.target.value)
          }
          placeholder={extra.placeholder}
        />
      )}

      {errors[name] && (
        <span className="field-error">
          {errors[name]}
        </span>
      )}
    </label>
  );

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            PEOPLE DIRECTORY <span>/</span> NEW PROFILE
          </p>

          <h1>Add employee</h1>

          <p className="muted">
            Create a new employee profile with the
            information your team needs.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${
            message.includes('successfully')
              ? 'success'
              : 'error'
          }`}
        >
          {message}
        </div>
      )}

      <form
        className="employee-form"
        onSubmit={submit}
      >
        <div className="form-section">
          <div className="section-label">
            <span>01</span>

            <div>
              <h2>Employee information</h2>
              <p>
                Core identity details for this profile.
              </p>
            </div>
          </div>

          <div className="form-grid">
            {field(
              'Employee name',
              'fullName',
              'text',
              {
                placeholder: 'e.g. Arun Kumar',
              }
            )}

            {field(
              'Employee ID',
              'employeeCode',
              'text',
              {
                placeholder: 'e.g. EMP001',
              }
            )}

            {field(
              'Email',
              'email',
              'email',
              {
                placeholder: 'name@company.com',
              }
            )}

            {field(
              'Password',
              'password',
              'password',
              {
                placeholder: 'Enter login password',
              }
            )}

            {field(
              'Role',
              'role',
              'select',
              {
                options: [
                  { id: 'EMPLOYEE', name: 'EMPLOYEE' },
                  { id: 'MANAGER', name: 'MANAGER' },
                  { id: 'HR', name: 'HR' },
                ],
              }
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="section-label">
            <span>02</span>

            <div>
              <h2>Employment information</h2>
              <p>
                Where this person sits in the organisation.
              </p>
            </div>
          </div>

          <div className="form-grid">
            {field(
              'Department',
              'departmentId',
              'select',
              {
                options: lookups.departments,
              }
            )}

            {field(
              'Team',
              'teamId',
              'select',
              {
                options: lookups.teams,
              }
            )}

            {field(
              'Designation',
              'designationId',
              'select',
              {
                options: lookups.designations,
              }
            )}

            {field(
              'Reporting manager',
              'managerId',
              'select',
              {
                options: lookups.managers,
              }
            )}

            {field(
              'Joining date',
              'joiningDate',
              'date'
            )}

            {field(
              'Status',
              'status',
              'select',
              {
                options: [
                  {
                    id: 'ACTIVE',
                    name: 'Active',
                  },
                  {
                    id: 'INACTIVE',
                    name: 'Inactive',
                  },
                ],
              }
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="text-btn"
            onClick={() =>
              navigate('/hr/dashboard')
            }
          >
            Cancel
          </button>

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? 'Creating...'
              : 'Create employee'}

            {!loading && <span>-&gt;</span>}
          </button>
        </div>
      </form>
    </section>
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/hr/login" element={<Login />} />

        {/* HR Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
          <Route element={<Shell />}>
            <Route path="/hr/dashboard" element={<Dashboard />} />
            <Route path="/hr/employees/add" element={<AddEmployee />} />
            <Route path="/hr/kpis" element={<KpiManagement />} />
            <Route path="/hr/managers" element={<ManagerManagement />} />
            <Route path="/hr/reports" element={<GenerateReports />} />
            <Route path="/hr/pms-lifecycle" element={<PmsLifecycle />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'HR']} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        </Route>

        {/* Employee Routes (Manjunath) */}
        <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']} />}>
          <Route element={<EmployeeShell />}>
            <Route path="/employee/dashboard" element={<EmpDashboard />} />
            <Route path="/dashboard" element={<EmpDashboard />} />
            <Route path="/kpis" element={<MyKpis />} />
            <Route path="/history" element={<PmsHistoryPage />} />
            <Route path="/history/:id" element={<HistoryDetail />} />
            <Route path="/reports" element={<MyReports />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}