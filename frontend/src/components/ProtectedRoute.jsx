import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
