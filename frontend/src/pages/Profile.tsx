import React, { useEffect, useState } from 'react';
import { employeeApi } from '../api/employeeApi';
import { Employee } from '../types';
import { User, Calendar, Mail, ShieldAlert, Award } from 'lucide-react';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeeApi.getProfile()
      .then((res) => {
        setProfile(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch profile details.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-96 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Profile</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Something went wrong.'}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-pms-gray font-sans">My Professional Profile</h2>
        <p className="text-xs text-slate-400 mt-1">Verify your corporate designations and reporting lines. Changes require HR administration requests.</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
        
        {/* Profile Banner */}
        <div className="h-32 bg-pms-gray relative">
          <div className="absolute top-0 right-0 w-48 h-full bg-pms-green/10 rounded-l-full filter blur-xl"></div>
        </div>

        {/* Profile Avatar Card */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 mb-6 gap-4">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-28 h-28 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-md">
                <div className="w-full h-full rounded-xl bg-pms-green/20 text-pms-darkGreen font-bold flex items-center justify-center text-4xl shadow-inner">
                  {profile.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-extrabold text-pms-gray">{profile.name}</h3>
                <p className="text-sm text-slate-500 font-semibold mt-0.5">{profile.designation}</p>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-pms-lightGreen text-pms-darkGreen border border-pms-green/10 uppercase">
              {profile.accountStatus}
            </span>

          </div>

          {/* Details list */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            
            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Employee ID</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold">EMP-{profile.id}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Corporate Email</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Mail size={16} className="text-slate-400" />
                <span className="font-semibold">{profile.email}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Department</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Award size={16} className="text-slate-400" />
                <span className="font-semibold">{profile.department}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Functional Team</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Award size={16} className="text-slate-400" />
                <span className="font-semibold">{profile.team || 'N/A'}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Reporting Manager</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <User size={16} className="text-slate-400" />
                <span className="font-semibold">{profile.managerName}</span>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Joining Date</p>
              <div className="flex items-center space-x-2.5 mt-1.5 text-pms-gray">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-semibold">{profile.joiningDate}</span>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">Need to update your records?</strong> To modify department mapping, managers, email configurations, or contact fields, please contact your company Human Resources administrator directly. Employees cannot self-edit core profile metrics.
          </div>

        </div>

      </div>
    </div>
  );
};
export default Profile;
