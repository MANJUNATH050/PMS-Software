import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export const SessionExpired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md w-full shadow-lg">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-505 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} className="text-rose-500" />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">Session Expired</h3>
        <p className="text-sm text-slate-500 mb-6">
          Your security session has expired or you have been logged out due to inactivity. Please sign in again.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors shadow"
        >
          <span>Return to Sign In</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
export default SessionExpired;
