import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    const isHr = user?.role === 'ROLE_HR' || user?.role === 'HR';
    const isManager = user?.role === 'ROLE_MANAGER' || user?.role === 'MANAGER';
    if (isHr) {
      navigate('/hr/dashboard');
    } else if (isManager) {
      navigate('/manager/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md w-full shadow-lg">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6">
          You are not authorized to view this resource. HR and Manager portals are restricted to authorized personnel.
        </p>
        <button
          onClick={handleReturn}
          className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors shadow"
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
