import { useEffect, useState } from 'react';

const getAuthHeaders = () => {
  const token = localStorage.getItem('pms_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const default12FRDKpis = [
  { kpiName: 'Sprint Task Completion', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Percentage of assigned sprint tasks completed within timeline' },
  { kpiName: 'Deadline Adherence', measurementPercent: 15, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Delivering assigned tasks on or before agreed deadlines' },
  { kpiName: 'Task Quality with Defects', measurementPercent: 10, selfRatingDefault: 4.5, managerRatingDefault: 4.0, description: 'Code quality measured by low bug/defect count in QA' },
  { kpiName: 'Prompt Quality - AI tasks', measurementPercent: 15, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Effectiveness and accuracy in AI tool prompt usage' },
  { kpiName: 'Jira Time Logging', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Timely and daily logging of work hours on Jira tickets' },
  { kpiName: 'Jira Discipline', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Maintaining ticket status accuracy and comments on Jira' },
  { kpiName: 'Accountability & Ownership', measurementPercent: 10, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Taking full ownership of assigned modules and resolution' },
  { kpiName: 'Leave Pattern', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Adherence to planned leave policy and notification' },
  { kpiName: 'Team Collaboration and Engagement', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Active participation in team discussions and peer support' },
  { kpiName: 'Punctuality', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'On-time attendance in daily standups and client meetings' },
  { kpiName: 'New Initiatives and Participation', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Proactive participation in internal knowledge sharing' },
  { kpiName: 'Rewards', measurementPercent: 5, selfRatingDefault: 5.0, managerRatingDefault: 4.0, description: 'Recognition and awards received during evaluation period' },
];

export default function KpiManagement() {
  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState(1);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form State for creating/editing KPI
  const [kpiName, setKpiName] = useState('');
  const [measurementPercent, setMeasurementPercent] = useState('');
  const [selfRatingDefault, setSelfRatingDefault] = useState('5.0');
  const [managerRatingDefault, setManagerRatingDefault] = useState('4.0');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch('/api/hr/designations', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDesignations(data);
          if (data.length > 0) setSelectedDesignation(data[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const loadKpis = () => {
    setLoading(true);
    fetch(`/api/hr/kpis?designationId=${selectedDesignation}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKpis(data);
        else setKpis([]);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedDesignation) loadKpis();
  }, [selectedDesignation]);

  const totalMeasurement = kpis.reduce((sum, k) => sum + (k.measurementPercent || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const weight = parseFloat(measurementPercent);
    if (!kpiName.trim() || isNaN(weight) || weight <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid KPI name and positive measurement percentage.' });
      return;
    }

    if (!editingId && totalMeasurement + weight > 100) {
      setMsg({ type: 'error', text: `Total weightage cannot exceed 100%. Current: ${totalMeasurement}%, adding ${weight}% exceeds limit.` });
      return;
    }

    const payload = {
      designationId: Number(selectedDesignation),
      kpiName: kpiName.trim(),
      measurementPercent: weight,
      selfRatingDefault: parseFloat(selfRatingDefault) || 5.0,
      managerRatingDefault: parseFloat(managerRatingDefault) || 4.0,
      description: description.trim(),
    };

    try {
      const url = editingId ? `/api/hr/kpis/${editingId}` : '/api/hr/kpis';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save KPI.');
      }

      setMsg({ type: 'success', text: editingId ? 'KPI updated successfully!' : 'KPI created successfully!' });
      setKpiName('');
      setMeasurementPercent('');
      setDescription('');
      setEditingId(null);
      loadKpis();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setMsg(null);
    try {
      for (const item of default12FRDKpis) {
        await fetch('/api/hr/kpis', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            designationId: Number(selectedDesignation),
            ...item,
          }),
        });
      }
      setMsg({ type: 'success', text: 'Successfully seeded all 12 FRD KPIs (Total 100% Weightage) for selected role!' });
      loadKpis();
    } catch (err) {
      setMsg({ type: 'error', text: 'Error seeding default KPIs.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (kpi) => {
    setEditingId(kpi.id);
    setKpiName(kpi.kpiName);
    setMeasurementPercent(kpi.measurementPercent);
    setSelfRatingDefault(kpi.selfRatingDefault || '5.0');
    setManagerRatingDefault(kpi.managerRatingDefault || '4.0');
    setDescription(kpi.description || '');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this KPI?')) return;
    try {
      await fetch(`/api/hr/kpis/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setMsg({ type: 'success', text: 'KPI deleted successfully!' });
      loadKpis();
    } catch (err) {
      setMsg({ type: 'error', text: 'Error deleting KPI.' });
    }
  };

  return (
    <div className="page" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-heading" style={{ marginBottom: '1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow" style={{ color: '#4A7637', fontWeight: '800', letterSpacing: '0.08em' }}>HR004 – KPI MANAGEMENT</p>
          <h1 style={{ fontSize: '2.1rem', color: '#3A3A3A', fontWeight: '800', marginTop: '0.2rem' }}>Add / Edit Role KPIs</h1>
          <p className="muted" style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Maintain role-based performance expectations. Total measurement weightage must not exceed 100%.
          </p>
        </div>

        <div style={{ textAlign: 'right', background: '#f4faf0', padding: '0.8rem 1.4rem', borderRadius: '12px', border: '1.5px solid #c8ebb6' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Role Total Weightage</span>
          <strong style={{ fontSize: '1.5rem', fontWeight: '800', color: totalMeasurement > 100 ? '#dc2626' : '#4A7637' }}>
            {totalMeasurement}% <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>/ 100%</span>
          </strong>
        </div>
      </div>

      {msg && (
        <div className={`banner ${msg.type}`} style={{ marginBottom: '1.6rem', padding: '1rem 1.4rem', borderRadius: '10px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b', fontWeight: '600', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
          {msg.text}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.8rem', alignItems: 'start' }}>
        
        {/* Left Form Card */}
        <div className="panel" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.8rem', boxShadow: '0 4px 20px -4px rgba(58, 58, 58, 0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.3rem', color: '#3A3A3A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            {editingId ? 'Edit Role KPI' : 'Create New KPI'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="field">
              <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#3A3A3A' }}>Select Role / Designation</label>
              <select
                value={selectedDesignation}
                onChange={(e) => setSelectedDesignation(Number(e.target.value))}
                style={{ height: '44px', borderRadius: '8px', border: '1.5px solid #cbd5e1', padding: '0 12px', fontSize: '0.92rem', fontWeight: '600', color: '#3A3A3A', outline: 'none' }}
              >
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#3A3A3A' }}>KPI & Goal Name</label>
              <input
                type="text"
                placeholder="e.g. Sprint Task Completion"
                value={kpiName}
                onChange={(e) => setKpiName(e.target.value)}
                style={{ height: '44px', borderRadius: '8px', border: '1.5px solid #cbd5e1', padding: '0 14px', fontSize: '0.92rem', outline: 'none' }}
                required
              />
            </div>

            <div className="field">
              <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#3A3A3A' }}>Measurement Criteria (%)</label>
              <input
                type="number"
                step="0.5"
                max="100"
                placeholder="e.g. 15"
                value={measurementPercent}
                onChange={(e) => setMeasurementPercent(e.target.value)}
                style={{ height: '44px', borderRadius: '8px', border: '1.5px solid #cbd5e1', padding: '0 14px', fontSize: '0.92rem', outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <div className="field">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#3A3A3A' }}>Self Rating (1-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={selfRatingDefault}
                  onChange={(e) => setSelfRatingDefault(e.target.value)}
                  style={{ height: '44px', borderRadius: '8px', border: '1.5px solid #cbd5e1', padding: '0 12px', fontSize: '0.92rem', textAlign: 'center', fontWeight: '700' }}
                />
              </div>

              <div className="field">
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#3A3A3A' }}>Manager Rating (1-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={managerRatingDefault}
                  onChange={(e) => setManagerRatingDefault(e.target.value)}
                  style={{ height: '44px', borderRadius: '8px', border: '1.5px solid #cbd5e1', padding: '0 12px', fontSize: '0.92rem', textAlign: 'center', fontWeight: '700' }}
                />
              </div>
            </div>

            <button className="primary-btn" type="submit" style={{ marginTop: '0.5rem', height: '46px', fontSize: '0.96rem', fontWeight: '700', borderRadius: '8px' }}>
              {editingId ? 'Update KPI' : 'Save KPI'}
            </button>
            {editingId && (
              <button
                type="button"
                className="logout-btn"
                style={{ height: '42px', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '8px', fontWeight: '600' }}
                onClick={() => { setEditingId(null); setKpiName(''); setMeasurementPercent(''); }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Right Table Card */}
        <div className="panel" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.8rem', boxShadow: '0 4px 20px -4px rgba(58, 58, 58, 0.05)' }}>
          <div className="panel-title" style={{ marginBottom: '1.4rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3A3A3A' }}>Mapped Role KPIs ({kpis.length})</h2>
            <span className="status-live" style={{ background: '#f4faf0', color: '#4A7637', borderColor: '#c8ebb6', padding: '0.35rem 0.85rem', fontWeight: '800' }}>
              {totalMeasurement}% Mapped
            </span>
          </div>

          {loading ? (
            <p style={{ color: '#64748b', padding: '1rem' }}>Loading mapped KPIs...</p>
          ) : kpis.length === 0 ? (
            <div style={{ textTransform: 'none', textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>
                No KPIs mapped to this designation yet.
              </p>
              <button
                className="primary-btn"
                onClick={handleSeedDefaults}
                disabled={seeding}
                style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem' }}
              >
                {seeding ? 'Seeding 12 KPIs...' : '✦ Seed Default 12 FRD KPIs (100% Total)'}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>#</th>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>Goals & KPIs</th>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>Weightage %</th>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>Self Rating</th>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>Manager Rating</th>
                    <th style={{ padding: '0.85rem 0.75rem', color: '#475569', fontWeight: '700' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k, idx) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: '700', color: '#3A3A3A' }}>{k.kpiName}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ background: '#f4faf0', color: '#4A7637', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', border: '1px solid #c8ebb6' }}>
                          {k.measurementPercent}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: '600', color: '#2563eb' }}>{k.selfRatingDefault}</td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: '600', color: '#4A7637' }}>{k.managerRatingDefault}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <button
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: '0.75rem', fontWeight: '700', fontSize: '0.85rem' }}
                          onClick={() => handleEdit(k)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                          onClick={() => handleDelete(k.id)}
                        >
                          Delete
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
