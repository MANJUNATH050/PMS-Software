import { useEffect, useState } from 'react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pms_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function GenerateReports() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [reportType, setReportType] = useState('RATING_DISTRIBUTION');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/hr/pms-lifecycle/employees', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleGenerate = () => {
    setLoading(true);
    fetch(`/api/hr/reports/generate?employeeId=${selectedEmp}&month=${selectedMonth}&reportType=${reportType}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setReportData(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">HR006 – GENERATE REPORTS</p>
          <h1>PMS Performance Reports</h1>
          <p className="muted">Filter performance reports by employee, month, and view rating distribution percentages.</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
          <div className="field">
            <label>Employee</label>
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
              <option value="ALL">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
            </select>
          </div>

          <div className="field">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="RATING_DISTRIBUTION">Rating % Category Distribution</option>
              <option value="EMPLOYEE_SUMMARY">Detailed Employee Performance</option>
            </select>
          </div>

          <button className="primary-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          {/* Rating Distribution Card */}
          <div className="panel">
            <div className="panel-title">
              <h2>Rating Category Distribution (%)</h2>
            </div>
            <p className="muted" style={{ marginBottom: '1rem' }}>Percentage of employees in each rating tier:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(reportData.ratingDistribution || {}).map(([category, percent]) => (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                    <span>{category}</span>
                    <span style={{ color: '#4A7637', fontWeight: '800' }}>{percent}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, background: '#6FC04A', height: '100%', borderRadius: '5px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Records List */}
          <div className="panel">
            <div className="panel-title">
              <h2>Reported Employee Profiles</h2>
              <span className="status-live">{reportData.totalEmployees || 0} Active</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem' }}>Code</th>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Designation</th>
                  <th style={{ padding: '0.75rem' }}>Manager</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.employeeList || []).map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#4A7637' }}>{emp.employeeCode}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{emp.fullName}</td>
                    <td style={{ padding: '0.75rem' }}>{emp.designationName || 'Software Engineer'}</td>
                    <td style={{ padding: '0.75rem' }}>{emp.managerName || 'Jane Manager'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
