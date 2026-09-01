import { useEffect, useState } from 'react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pms_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function ManagerManagement() {
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');

  const loadData = () => {
    setLoading(true);
    const headers = getAuthHeaders();
    Promise.all([
      fetch('/api/hr/managers/list', { headers }).then((r) => r.json()),
      fetch('/api/hr/departments', { headers }).then((r) => r.json()),
      fetch('/api/hr/designations', { headers }).then((r) => r.json()),
    ])
      .then(([mgrs, depts, desigs]) => {
        if (Array.isArray(mgrs)) setManagers(mgrs);
        if (Array.isArray(depts)) {
          setDepartments(depts);
          if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
        }
        if (Array.isArray(desigs)) {
          setDesignations(desigs);
          if (desigs.length > 0 && !designationId) setDesignationId(desigs[0].id);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddManager = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setMsg({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    try {
      const res = await fetch('/api/hr/managers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password,
          departmentId: Number(departmentId),
          designationId: Number(designationId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create manager.');

      setMsg({ type: 'success', text: `Manager created successfully (${data.employeeCode})! Available in Reporting Manager dropdown.` });
      setFullName('');
      setEmail('');
      setPassword('Password123!');
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this manager record?')) return;
    try {
      await fetch(`/api/hr/managers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setMsg({ type: 'success', text: 'Manager removed successfully.' });
      loadData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Error removing manager.' });
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">HR005 – MANAGER MANAGEMENT</p>
          <h1>Add / Edit Managers</h1>
          <p className="muted">Manage reporting manager records for employee mapping and manager logins.</p>
        </div>
      </div>

      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Form */}
        <div className="panel">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: '#3A3A3A' }}>Add New Manager</h2>

          <form onSubmit={handleAddManager} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label>Full Name</label>
              <input type="text" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="field">
              <label>Email Address</label>
              <input type="email" placeholder="ramesh@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label>Initial Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="field">
              <label>Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Designation</label>
              <select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <button className="primary-btn" type="submit">
              Add Manager
            </button>
          </form>
        </div>

        {/* Right List */}
        <div className="panel">
          <div className="panel-title">
            <h2>Active Reporting Managers</h2>
            <span className="status-live">{managers.length} Managers</span>
          </div>

          {loading ? (
            <p>Loading managers...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem' }}>Code</th>
                    <th style={{ padding: '0.75rem' }}>Manager Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Department</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#4A7637' }}>{m.employeeCode}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>{m.fullName}</td>
                      <td style={{ padding: '0.75rem' }}>{m.email}</td>
                      <td style={{ padding: '0.75rem' }}>{m.departmentName || 'Engineering'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '600' }}
                          onClick={() => handleDelete(m.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
