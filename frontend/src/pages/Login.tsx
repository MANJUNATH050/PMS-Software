import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pms-gray flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center relative" style={{ backgroundImage: "linear-gradient(rgba(58, 58, 58, 0.95), rgba(58, 58, 58, 0.98))" }}>
      
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pms-green/5 rounded-full filter blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pms-darkGreen/5 rounded-full filter blur-3xl -z-10"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-pms-green flex items-center justify-center text-white shadow-lg shadow-pms-green/20 ring-4 ring-pms-green/10">
            <Target size={28} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          ASEURO Performance Management
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your corporate credentials to sign in
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-md flex items-start space-x-3">
                <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                <span className="text-xs text-rose-800 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green transition-all"
                  placeholder="employee@aseuro.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Security Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-pms-gray placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pms-green/50 focus:border-pms-green transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-pms-green focus:ring-pms-green border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-500 font-medium">
                  Remember my session
                </label>
              </div>

              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => alert("Please contact your departmental HR administrator to initiate password recovery.")}
                  className="font-semibold text-pms-green hover:text-pms-darkGreen"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-pms-green hover:bg-pms-darkGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pms-green transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          {/* Seed accounts helper hint */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sample Account Credentials:</h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 space-y-1">
              <p className="text-[11px] text-slate-500 font-medium"><strong className="text-pms-gray font-semibold">Email:</strong> employee@aseuro.com</p>
              <p className="text-[11px] text-slate-500 font-medium"><strong className="text-pms-gray font-semibold">Password:</strong> password</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Login;
