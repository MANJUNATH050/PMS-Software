import { useEffect, useState } from 'react';
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

export default function ManagerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [managerRatings, setManagerRatings] = useState({});
  const [managerComments, setManagerComments] = useState({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    // Load direct report employees for Manager
    fetch('/api/hr/pms-lifecycle/employees', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeamMembers(data);
          if (data.length > 0) setSelectedEmp(data[0]);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const loadEmployeeEvaluation = (empId) => {
    if (!empId) return;
    setLoading(true);
    fetch(`/api/hr/pms-lifecycle/employee/${empId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.kpis) {
          setKpis(data.kpis);
          const initialRatings = {};
          const initialComments = {};
          data.kpis.forEach((k) => {
            initialRatings[k.kpiId] = k.managerRating || 4.0;
            initialComments[k.kpiId] = k.managerComments || 'Good performance and delivery';
          });
          setManagerRatings(initialRatings);
          setManagerComments(initialComments);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedEmp?.id) {
      loadEmployeeEvaluation(selectedEmp.id);
    }
  }, [selectedEmp]);

  const handleRatingChange = (kpiId, val) => {
    setManagerRatings((prev) => ({ ...prev, [kpiId]: parseFloat(val) || 0 }));
  };

  const handleCommentsChange = (kpiId, val) => {
    setManagerComments((prev) => ({ ...prev, [kpiId]: val }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedEmp) return;
    setSubmitting(true);
    setMsg(null);

    const ratingsPayload = kpis.map((k) => ({
      kpiId: k.kpiId,
      selfRating: k.selfRating,
      managerRating: managerRatings[k.kpiId] || k.managerRating || 4.0,
      hrRating: managerRatings[k.kpiId] || k.managerRating || 4.0,
      comments: managerComments[k.kpiId] || '',
    }));

    try {
      const res = await fetch('/api/hr/pms-lifecycle/finalise', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          evaluationMonth: '2026-08',
          ratings: ratingsPayload,
          generalRemarks: generalRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error submitting manager evaluation.');

      setMsg({ type: 'success', text: `Manager Evaluation submitted successfully for ${selectedEmp.fullName}! Locked & sent to HR Review.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateOverallScore = () => {
    if (kpis.length === 0) return '0.00';
    let totalWeight = 0;
    let weightedSum = 0;
    kpis.forEach((k) => {
      const r = managerRatings[k.kpiId] !== undefined ? managerRatings[k.kpiId] : (k.managerRating || 4.0);
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
          <span className="portal-badge manager" style={{ background: '#dbeafe', color: '#1e40af', padding: '0.3rem 0.85rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: '700' }}>
            Manager Portal (Saqulain - MG003/MG004)
          </span>
        </div>

        <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="user-name" style={{ fontWeight: '700', fontSize: '0.98rem', color: '#3A3A3A' }}>{user?.fullName || user?.name || 'Manager User'}</span>
            <span className="user-email" style={{ fontSize: '0.84rem', color: '#64748b' }}>{user?.email || 'manager.demo@company.com'}</span>
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
        <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', padding: '2.2rem 2.8rem', borderRadius: '1.4rem', color: '#fff', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(30, 64, 175, 0.3)' }}>
          <div>
            <h2 style={{ fontSize: '1.9rem', margin: '0 0 0.4rem 0', fontWeight: '800' }}>Welcome, {user?.fullName || user?.name || 'Manager'}!</h2>
            <p style={{ opacity: 0.95, fontSize: '1.02rem', margin: 0 }}>
              Team Performance Evaluation — Review self-assessments, score KPIs, provide feedback, and submit evaluations.
            </p>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.45rem 1.1rem', borderRadius: '2rem', fontWeight: '800', letterSpacing: '0.05em' }}>
            MANAGER
          </span>
        </div>

        {msg && <div className={`banner ${msg.type}`} style={{ marginBottom: '1.6rem', padding: '1rem 1.4rem', borderRadius: '10px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b', fontWeight: '600', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>{msg.text}</div>}

        {/* Direct Reports Selector */}
        <div className="panel" style={{ background: '#fff', borderRadius: '1.2rem', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.8rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A3A3A', marginBottom: '0.8rem' }}>Select Assigned Employee for Review</h3>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {teamMembers.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                style={{
                  padding: '0.65rem 1.2rem',
                  borderRadius: '10px',
                  border: selectedEmp?.id === emp.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedEmp?.id === emp.id ? '#eff6ff' : '#ffffff',
                  color: selectedEmp?.id === emp.id ? '#1e40af' : '#3A3A3A',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {emp.fullName} ({emp.employeeCode})
              </button>
            ))}
          </div>
        </div>

        {selectedEmp && (
          <>
            {/* Header Details Card */}
            <div className="panel" style={{ background: '#fff', borderRadius: '1.4rem', padding: '1.8rem', border: '1px solid #e2e8f0', marginBottom: '1.8rem', borderLeft: '5px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#3A3A3A', margin: '0 0 0.3rem 0' }}>{selectedEmp.fullName}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                    ID: <strong>{selectedEmp.employeeCode}</strong> | Designation: <strong>{selectedEmp.designationName || 'Software Engineer'}</strong> | Department: <strong>{selectedEmp.departmentName || 'Engineering'}</strong>
                  </p>
                </div>

                <div style={{ background: '#f4faf0', border: '1px solid #c8ebb6', padding: '0.6rem 1.2rem', borderRadius: '12px', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', display: 'block' }}>Calculated Manager Score</span>
                  <strong style={{ fontSize: '1.4rem', color: '#4A7637', fontWeight: '800' }}>{calculateOverallScore()} / 5.00</strong>
                </div>
              </div>
            </div>

            {/* KPI Evaluation Cards (Side-by-Side Employee Self Assessment vs Manager Performance Evaluation) */}
            <div className="panel" style={{ background: '#fff', borderRadius: '1.4rem', padding: '2rem', border: '1px solid #e2e8f0', marginBottom: '1.8rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#3A3A3A', marginBottom: '1.4rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                Side-by-Side KPI Evaluation (MG003)
              </h3>

              {loading ? (
                <p>Loading employee evaluation details...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {kpis.map((kpi, idx) => (
                    <div key={kpi.kpiId} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.4rem', background: '#fafafa', borderLeft: '4px solid #2563eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A3A3A', margin: 0 }}>
                          #{idx + 1}. {kpi.kpiName}
                        </h4>
                        <span style={{ background: '#f4faf0', color: '#4A7637', border: '1px solid #c8ebb6', padding: '0.3rem 0.8rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem' }}>
                          Weightage: {kpi.measurementPercent}%
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#ffffff', padding: '1.2rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        {/* Left: Employee Self Assessment */}
                        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '1rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                            🔒 Employee Self Assessment (Read-Only)
                          </span>
                          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2563eb', marginBottom: '0.4rem' }}>
                            {kpi.selfRating} / 5.0
                          </div>
                          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                            {kpi.comments || 'No specific self-comments provided.'}
                          </p>
                        </div>

                        {/* Right: Manager Performance Evaluation */}
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                            ✓ Manager Performance Evaluation (Editable)
                          </span>
                          <div className="field" style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.82rem' }}>Manager Score (Scale 1.00 - 5.00)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              value={managerRatings[kpi.kpiId] !== undefined ? managerRatings[kpi.kpiId] : (kpi.managerRating || 4.0)}
                              onChange={(e) => handleRatingChange(kpi.kpiId, e.target.value)}
                              style={{ width: '90px', padding: '0.4rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '800', color: '#4A7637' }}
                            />
                          </div>

                          <div className="field">
                            <label style={{ fontSize: '0.82rem' }}>Manager Feedback & Justification</label>
                            <input
                              type="text"
                              placeholder="Enter feedback notes..."
                              value={managerComments[kpi.kpiId] !== undefined ? managerComments[kpi.kpiId] : 'Good performance and delivery'}
                              onChange={(e) => handleCommentsChange(kpi.kpiId, e.target.value)}
                              style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overall Manager Remarks & Submit Button */}
            <div className="panel" style={{ background: '#fff', borderRadius: '1.4rem', padding: '1.8rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A3A3A', marginBottom: '0.75rem' }}>Overall Manager Remarks</h4>
              <textarea
                rows={3}
                placeholder="Summarize overall performance, strengths, growth areas, and recommendations..."
                value={generalRemarks}
                onChange={(e) => setGeneralRemarks(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.92rem', outline: 'none' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.4rem' }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleSubmitEvaluation}
                  disabled={submitting}
                  style={{ height: '48px', padding: '0 2rem', fontSize: '0.98rem', fontWeight: '800', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' }}
                >
                  {submitting ? 'Submitting Review...' : 'Submit Manager Evaluation'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
