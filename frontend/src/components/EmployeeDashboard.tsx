import React, { useState, useEffect } from 'react';
import aseuroLogo from '../assets/aseuro-logo.png';
import type { AuthUser } from '../types';

interface EmployeeDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/employee/dashboard', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch((e) => console.error(e));
  }, [user.token]);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-navbar">
        <div className="nav-brand">
          <img src={aseuroLogo} alt="Aseuro Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="brand-name">aseuro</span>
          <span className="portal-badge employee">Employee Portal</span>
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
        <div className="welcome-banner employee-gradient">
          <div className="welcome-text">
            <h2>Welcome, {user.fullName}!</h2>
            <p>
              Your employee credentials have been verified from the database. Complete your monthly self-assessment.
            </p>
          </div>
          <div className="welcome-badge">
            <span className="badge-role">EMPLOYEE</span>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{dashboardData?.currentCycle ?? 'August 2026'}</span>
            <span className="stat-label">Active PMS Cycle</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">Self Review Draft</span>
            <span className="stat-label">Cycle Status</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">4</span>
            <span className="stat-label">Assigned Role KPIs</span>
          </div>
        </div>

        <div className="tab-content" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3>My Role KPIs & Self-Assessment</h3>
            <p>Rate your performance against assigned measurement criteria (Scale 1.0 - 5.0)</p>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>KPI Name</th>
                  <th>Measurement Criteria</th>
                  <th>Weightage</th>
                  <th>Self Rating</th>
                  <th>Manager Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Code Quality & Delivery</strong></td>
                  <td>Deliver sprint tasks on schedule with clean unit test coverage</td>
                  <td>35%</td>
                  <td><input type="number" min="1" max="5" defaultValue="4.5" className="rating-input" /></td>
                  <td><span className="status-badge pending">Pending Manager</span></td>
                </tr>
                <tr>
                  <td><strong>System Design & Architecture</strong></td>
                  <td>Contribute to modular component design and backend reliability</td>
                  <td>25%</td>
                  <td><input type="number" min="1" max="5" defaultValue="4.0" className="rating-input" /></td>
                  <td><span className="status-badge pending">Pending Manager</span></td>
                </tr>
                <tr>
                  <td><strong>Collaboration & Agility</strong></td>
                  <td>Participate actively in standups, code reviews, and sprint planning</td>
                  <td>20%</td>
                  <td><input type="number" min="1" max="5" defaultValue="5.0" className="rating-input" /></td>
                  <td><span className="status-badge pending">Pending Manager</span></td>
                </tr>
                <tr>
                  <td><strong>Continuous Learning & Innovation</strong></td>
                  <td>Explore modern tools and propose developer productivity enhancements</td>
                  <td>20%</td>
                  <td><input type="number" min="1" max="5" defaultValue="4.5" className="rating-input" /></td>
                  <td><span className="status-badge pending">Pending Manager</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="primary-btn" onClick={() => alert('Self assessment saved successfully!')}>
              Save Draft & Submit Self Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
