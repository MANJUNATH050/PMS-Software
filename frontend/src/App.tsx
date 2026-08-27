<<<<<<< HEAD
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MyKpis } from './pages/MyKpis';
import { PmsHistoryPage } from './pages/PmsHistoryPage';
import { HistoryDetail } from './pages/HistoryDetail';
import { MyReports } from './pages/MyReports';
import { Profile } from './pages/Profile';
import { SessionExpired } from './pages/SessionExpired';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-pms-green/20 border-t-pms-green animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kpis"
            element={
              <ProtectedRoute>
                <MyKpis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PmsHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <ProtectedRoute>
                <HistoryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Index Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
=======
import { useEffect, useState } from 'react';
import './App.css';
import type { AuthUser } from './types';
import { LoginPage } from './components/LoginPage';
import { HrDashboard } from './components/HrDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('pms_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loginNotice, setLoginNotice] = useState(false);

  useEffect(() => {
    if (!loginNotice) return;
    const timeout = window.setTimeout(() => setLoginNotice(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [loginNotice]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('pms_user', JSON.stringify(user));
    localStorage.setItem('pms_token', user.token);
    setLoginNotice(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pms_user');
    localStorage.removeItem('pms_token');
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  let dashboard;
  switch (currentUser.role) {
    case 'HR':
      dashboard = <HrDashboard user={currentUser} onLogout={handleLogout} />;
      break;
    case 'MANAGER':
      dashboard = <ManagerDashboard user={currentUser} onLogout={handleLogout} />;
      break;
    case 'EMPLOYEE':
      dashboard = <EmployeeDashboard user={currentUser} onLogout={handleLogout} />;
      break;
    default:
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{loginNotice && <div className="login-success-toast" role="status">✓ Logged in successfully</div>}{dashboard}</>;
}

>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
export default App;
