import { useEffect, useState } from 'react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pms_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function PmsLifecycle() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/hr/pms-lifecycle/employees', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (data.length > 0) {
            setSelectedEmpId(data[0].id);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const loadEmployeeDetails = (empId) => {
    if (!empId) return;
    setLoading(true);
    fetch(`/api/hr/pms-lifecycle/employee/${empId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.employee) {
          setEmployeeData(data.employee);
          setKpis(data.kpis || []);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedEmpId) loadEmployeeDetails(selectedEmpId);
  }, [selectedEmpId]);

  const handleRatingChange = (kpiId, field, value) => {
    setKpis((prev) =>
      prev.map((k) => (k.kpiId === kpiId ? { ...k, [field]: parseFloat(value) || 0 } : k))
    );
  };

  const handleFinalize = async () => {
    if (!employeeData) return;
    setSubmitting(true);
    setMsg(null);

    const ratingsPayload = kpis.map((k) => ({
      kpiId: k.kpiId,
      selfRating: k.selfRating,
      managerRating: k.managerRating,
      hrRating: k.hrRating || k.managerRating,
    }));

    try {
      const res = await fetch('/api/hr/pms-lifecycle/finalise', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeId: employeeData.id,
          evaluationMonth: '2026-08',
          ratings: ratingsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error finalizing PMS.');

      setMsg({ type: 'success', text: 'Finalized PMS details submitted successfully! Stored in database for reports and logins.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateOverallScore = () => {
    if (kpis.length === 0) return 0;
    const totalWeightedScore = kpis.reduce(
      (sum, k) => sum + ((k.managerRating || 0) * (k.measurementPercent || 0)) / 100,
      0
    );
    return totalWeightedScore.toFixed(2);
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">HR007 – VIEW EMPLOYEES PMS LIFECYCLE</p>
          <h1>Employee PMS Lifecycle & Finalization</h1>
          <p className="muted">Track employee details, self rating, manager rating, and finalize PMS report.</p>
        </div>
      </div>

      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      {/* Employee Search & Dropdown Filter */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div className="field">
            <label>Search Employee (Name / Code / Email)</label>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Select Employee Dropdown</label>
            <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
              {filteredEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode}) - {e.designationName || 'Software Engineer'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading PMS Lifecycle details...</p>
      ) : employeeData ? (
        <>
          {/* Employee Header Details */}
          <div className="panel" style={{ marginBottom: '1.5rem', background: '#ffffff', borderLeft: '4px solid #6FC04A' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#3A3A3A' }}>Employee Details Header</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.92rem' }}>
              <div><strong>Employee Name:</strong> <p>{employeeData.fullName}</p></div>
              <div><strong>Employee ID:</strong> <p style={{ color: '#4A7637', fontWeight: '700' }}>{employeeData.employeeCode}</p></div>
              <div><strong>Designation:</strong> <p>{employeeData.designationName || 'Software Engineer'}</p></div>
              <div><strong>Reporting Manager:</strong> <p>{employeeData.managerName || 'Jane Manager'}</p></div>
              <div><strong>Department:</strong> <p>{employeeData.departmentName || 'Engineering'}</p></div>
              <div><strong>Status:</strong> <p><span className="status-live">{employeeData.status}</span></p></div>
            </div>
          </div>

          {/* KPI Ratings Table */}
          <div className="panel">
            <div className="panel-title">
              <h2>Mapped Role KPIs & Ratings Overview</h2>
              <span className="status-live" style={{ background: '#f4faf0', color: '#4A7637', borderColor: '#c8ebb6' }}>
                Overall KPI Score: {calculateOverallScore()} / 5.0
              </span>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem' }}>Sl.</th>
                    <th style={{ padding: '0.75rem' }}>Goals & KPIs</th>
                    <th style={{ padding: '0.75rem' }}>Measurement %</th>
                    <th style={{ padding: '0.75rem' }}>Self Rating</th>
                    <th style={{ padding: '0.75rem' }}>Manager Rating</th>
                    <th style={{ padding: '0.75rem' }}>HR Rating (Editable)</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k, idx) => (
                    <tr key={k.kpiId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '700' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>{k.kpiName}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#4A7637' }}>{k.measurementPercent}%</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#2563eb' }}>{k.selfRating}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#4A7637' }}>{k.managerRating}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          style={{ width: '70px', padding: '0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700' }}
                          value={k.hrRating !== undefined ? k.hrRating : k.managerRating}
                          onChange={(e) => handleRatingChange(k.kpiId, 'hrRating', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" onClick={handleFinalize} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Finalise and Submit'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>No employee selected.</p>
      )}
    </div>
  );
}
