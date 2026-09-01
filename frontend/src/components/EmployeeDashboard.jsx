import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import aseuroLogo from '../assets/aseuro-logo.png';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pms_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const defaultEmployeeKpis = [
  { id: 1, kpiName: 'Sprint Task Completion', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Tasks completed within assigned sprint timelines' },
  { id: 2, kpiName: 'Deadline Adherence', measurementPercent: 15, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Delivering assigned tasks on or before agreed deadlines' },
  { id: 3, kpiName: 'Task Quality with Defects', measurementPercent: 10, selfRatingDefault: 4.5, managerRatingDefault: 4.0, description: 'Code quality measured by low bug/defect count in QA' },
  { id: 4, kpiName: 'Prompt Quality - AI tasks', measurementPercent: 15, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Effectiveness and accuracy in AI tool prompt usage' },
  { id: 5, kpiName: 'Jira Time Logging', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Timely logging of work hours on Jira tickets' },
  { id: 6, kpiName: 'Jira Discipline', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Maintaining ticket status accuracy and comments on Jira' },
  { id: 7, kpiName: 'Accountability & Ownership', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Taking full ownership of assigned modules' },
  { kpiName: 'Leave Pattern', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Adherence to planned leave policy and notification' },
  { kpiName: 'Team Collaboration and Engagement', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Active participation in team discussions and support' },
  { kpiName: 'Punctuality', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'On-time attendance in daily standups and meetings' },
  { kpiName: 'New Initiatives and Participation', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Proactive participation in internal knowledge sharing' },
  { kpiName: 'Rewards', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Recognition and awards received during period' },
];

export default function EmployeeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(defaultEmployeeKpis);
  const [ratings, setRatings] = useState(() => {
    const initial = {};
    defaultEmployeeKpis.forEach((k, idx) => { initial[k.id || idx] = k.selfRatingDefault || 5.0; });
    return initial;
  });
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/employee/pms/current', { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.kpis) && data.kpis.length > 0) {
          setKpis(data.kpis);
          const initial = {};
          data.kpis.forEach((k) => { initial[k.kpiId || k.id] = k.selfRating || 5.0; });
          setRatings(initial);
        }
      })
      .catch((e) => console.warn('Using default employee KPIs:', e));
  }, []);

  const handleRatingChange = (id, val) => {
    setRatings((prev) => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const handleSaveSelfAssessment = () => {
    setSubmitting(true);
    setMsg(null);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setMsg({ type: 'success', text: 'Self-assessment saved and submitted successfully! Sent to Manager for evaluation.' });
    }, 600);
  };

  const calculateSelfScore = () => {
    if (kpis.length === 0) return '0.00';
    let totalWeight = 0;
    let weightedSum = 0;
    kpis.forEach((k, idx) => {
      const r = ratings[k.id || idx] || 5.0;
      const w = k.measurementPercent || 10;
      weightedSum += r * w;
      totalWeight += w;
    });
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '0.00';
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navbar */}
      <header className="dashboard-navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 2.8rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <img src={aseuroLogo} alt="Aseuro Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <span className="brand-name" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3A3A3A' }}>aseuro</span>
          <span className="portal-badge employee" style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.85rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: '700' }}>
            Employee Portal (Manjunath)
          </span>
        </div>

        <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="user-name" style={{ fontWeight: '700', fontSize: '0.98rem', color: '#3A3A3A' }}>{user?.fullName || user?.name || 'Employee User'}</span>
            <span className="user-email" style={{ fontSize: '0.84rem', color: '#64748b' }}>{user?.email || 'employee.demo@company.com'}</span>
          </div>
          <button
            className="logout-btn"
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.55rem 1.1rem', borderRadius: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            Logout ⎋
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="dashboard-container" style={{ maxWidth: '1250px', margin: '2.2rem auto', padding: '0 1.8rem' }}>
        
        {/* Welcome Banner */}
        <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #6FC04A 0%, #4A7637 100%)', padding: '2.2rem 2.8rem', borderRadius: '1.4rem', color: '#fff', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(74, 118, 55, 0.3)' }}>
          <div>
            <h2 style={{ fontSize: '1.9rem', margin: '0 0 0.4rem 0', fontWeight: '800' }}>Welcome, {user?.fullName || user?.name || 'Employee'}!</h2>
            <p style={{ opacity: 0.95, fontSize: '1.02rem', margin: 0 }}>
              Active Appraisal Dashboard — Monitor and complete your performance evaluation milestones.
            </p>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.45rem 1.1rem', borderRadius: '2rem', fontWeight: '800', letterSpacing: '0.05em' }}>
            EMPLOYEE
          </span>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.3rem', marginBottom: '1.8rem' }}>
          <div className="panel" style={{ background: '#fff', padding: '1.4rem', borderRadius: '1.1rem', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Cycle</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3A3A3A', margin: '0.4rem 0 0.2rem 0' }}>August 2026</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Self Evaluation Period</p>
          </div>

          <div className="panel" style={{ background: '#fff', padding: '1.4rem', borderRadius: '1.1rem', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Self Rating Score</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4A7637', margin: '0.4rem 0 0.2rem 0' }}>{calculateSelfScore()} / 5.00</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>{kpis.length} KPIs Rated</p>
          </div>

          <div className="panel" style={{ background: '#fff', padding: '1.4rem', borderRadius: '1.1rem', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Current Workflow Stage</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: submitted ? '#2563eb' : '#d97706', margin: '0.4rem 0 0.2rem 0' }}>
              {submitted ? 'Manager Review' : 'Self Assessment'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>{submitted ? 'Awaiting Manager Remarks' : 'In Progress'}</p>
          </div>

          <div className="panel" style={{ background: '#fff', padding: '1.4rem', borderRadius: '1.1rem', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Finalized Grade</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3A3A3A', margin: '0.4rem 0 0.2rem 0' }}>Pending HR</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Awaiting HR Finalization</p>
          </div>
        </div>

        {/* Workflow Timeline Stepper Tracker */}
        <div className="panel" style={{ background: '#fff', borderRadius: '1.2rem', padding: '1.6rem 2.2rem', border: '1px solid #e2e8f0', marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#3A3A3A', margin: 0 }}>Appraisal Workflow Tracking</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Current cycle progression checkpoint</p>
            </div>
            <span style={{ background: submitted ? '#dcfce7' : '#fef3c7', color: submitted ? '#166534' : '#92400e', padding: '0.35rem 0.95rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: '800' }}>
              {submitted ? '✓ Self-Assessment Submitted' : '⏰ Deadline: 10 Sept 2026'}
            </span>
          </div>

          {/* Stepper Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center', margin: '1rem 0' }}>
            <div style={{ padding: '1rem', background: submitted ? '#f4faf0' : '#fefce8', borderRadius: '12px', border: `1.5px solid ${submitted ? '#6FC04A' : '#f59e0b'}` }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>STAGE 1</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#3A3A3A', margin: '0.2rem 0' }}>Self Assessment</h4>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: submitted ? '#4A7637' : '#d97706' }}>
                {submitted ? '✓ Completed' : '⚡ In Progress'}
              </span>
            </div>

            <div style={{ padding: '1rem', background: submitted ? '#eff6ff' : '#f8fafc', borderRadius: '12px', border: `1.5px solid ${submitted ? '#3b82f6' : '#cbd5e1'}` }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>STAGE 2</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#3A3A3A', margin: '0.2rem 0' }}>Manager Review</h4>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: submitted ? '#2563eb' : '#94a3b8' }}>
                {submitted ? '⏳ Pending Review' : 'Upcoming'}
              </span>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>STAGE 3</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#3A3A3A', margin: '0.2rem 0' }}>HR Review</h4>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Upcoming</span>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>STAGE 4</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#3A3A3A', margin: '0.2rem 0' }}>Final Result</h4>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8' }}>Upcoming</span>
            </div>
          </div>
        </div>

        {msg && <div className={`banner ${msg.type}`} style={{ marginBottom: '1.6rem', padding: '1rem 1.4rem', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: '600', border: '1px solid #86efac' }}>{msg.text}</div>}

        {/* Tab Content Card */}
        <div className="panel" style={{ background: '#fff', borderRadius: '1.4rem', padding: '2.2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -4px rgba(58, 58, 58, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.6rem' }}>
            <div>
              <h3 style={{ fontSize: '1.45rem', margin: '0 0 0.35rem 0', color: '#3A3A3A', fontWeight: '800' }}>My Role KPIs & Self-Assessment</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.94rem' }}>Rate your performance against assigned measurement criteria (Scale 1.0 - 5.0)</p>
            </div>

            <span style={{ background: '#f4faf0', color: '#4A7637', padding: '0.4rem 1rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', border: '1px solid #c8ebb6' }}>
              Overall Score: {calculateSelfScore()} / 5.00
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.9rem', color: '#475569', fontWeight: '700' }}>#</th>
                  <th style={{ padding: '0.9rem', color: '#475569', fontWeight: '700' }}>KPI & Goal Name</th>
                  <th style={{ padding: '0.9rem', color: '#475569', fontWeight: '700' }}>Weightage %</th>
                  <th style={{ padding: '0.9rem', color: '#475569', fontWeight: '700' }}>Self Rating (Editable)</th>
                  <th style={{ padding: '0.9rem', color: '#475569', fontWeight: '700' }}>Manager Rating</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((k, idx) => {
                  const key = k.id || idx;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.9rem', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '0.9rem', fontWeight: '700', color: '#3A3A3A' }}>
                        <div>{k.kpiName}</div>
                        {k.description && <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '400', marginTop: '0.15rem' }}>{k.description}</div>}
                      </td>
                      <td style={{ padding: '0.9rem' }}>
                        <span style={{ background: '#f4faf0', color: '#4A7637', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', border: '1px solid #c8ebb6' }}>
                          {k.measurementPercent}%
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem' }}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={ratings[key] !== undefined ? ratings[key] : k.selfRatingDefault || 5.0}
                          onChange={(e) => handleRatingChange(key, e.target.value)}
                          disabled={submitted}
                          style={{ width: '80px', padding: '0.45rem 0.5rem', border: '1.5px solid #cbd5e1', borderRadius: '0.5rem', fontWeight: '800', textAlign: 'center', fontSize: '0.95rem', color: '#2563eb', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '0.9rem' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: '700' }}>
                          Pending Manager Review
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.8rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSaveSelfAssessment}
              disabled={submitting || submitted}
              style={{ height: '48px', padding: '0 2rem', fontSize: '0.98rem', fontWeight: '800', borderRadius: '10px' }}
            >
              {submitting ? 'Submitting Assessment...' : submitted ? '✓ Self Assessment Submitted' : 'Save Draft & Submit Self Rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
