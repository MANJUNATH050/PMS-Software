import React, { useState, useEffect } from 'react';
import aseuroLogo from '../assets/aseuro-logo.png';
import type { AuthUser } from '../types';

interface ManagerDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/manager/dashboard', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user.token]);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-navbar">
        <div className="nav-brand">
          <img src={aseuroLogo} alt="Aseuro Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="brand-name">aseuro</span>
          <span className="portal-badge manager">Manager Portal</span>
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

      <div className="dashboard-container">
        <div className="welcome-banner manager-gradient">
          <div className="welcome-text">
            <h2>Welcome, {user.fullName}!</h2>
            <p>
              Your manager credentials have been verified from the database. Here is your team review overview.
            </p>
          </div>
          <div className="welcome-badge">
            <span className="badge-role">MANAGER</span>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{dashboardData?.teamCount ?? 1}</span>
            <span className="stat-label">Assigned Team Members</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">August 2026</span>
            <span className="stat-label">Current PMS Cycle</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">Pending</span>
            <span className="stat-label">My Self Review Status</span>
          </div>
        </div>

        <div className="tab-content" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3>Assigned Team Members</h3>
            <p>Employees mapped to your reporting hierarchy by HR</p>
          </div>

          {loading ? (
            <div className="loading-state">Loading team members...</div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Code</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Self-Review Status</th>
                    <th>Manager Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.teamMembers && dashboardData.teamMembers.length > 0 ? (
                    dashboardData.teamMembers.map((m: any, idx: number) => (
                      <tr key={idx}>
                        <td><strong>{m.code}</strong></td>
                        <td>{m.name}</td>
                        <td><code>{m.email}</code></td>
                        <td><span className="status-badge pending">Submitted</span></td>
                        <td><span className="action-pill">Open Review ✎</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>
                        No direct reportees assigned yet. When HR assigns employees to you, they will appear here automatically.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
