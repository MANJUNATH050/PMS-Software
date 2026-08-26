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

export default App;
