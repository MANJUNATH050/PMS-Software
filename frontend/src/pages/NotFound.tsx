import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md w-full shadow-lg">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-pms-gray mb-2">Page Not Found</h3>
        <p className="text-sm text-slate-500 mb-6">
          The requested page does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors shadow"
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
export default NotFound;
