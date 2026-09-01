import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Target,
  BarChart2,
  Sparkles,
  CheckCircle2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { authApi } from '../api/authApi';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lock State & Countdown Timer
  const [isLocked, setIsLocked] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Forgot / Reset Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotNotice, setForgotNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const passwordCriteria = 'Password must be at least 8 characters long.';

  const validPassword = (val: string) => val.length >= 8;

  // Format MM:SS for countdown timer
  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Start real-time countdown timer
  const startCountdown = (initialSecs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setCountdownSeconds(initialSecs);
    setIsLocked(true);

    timerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsLocked(false);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Check backend lock status when email changes
  useEffect(() => {
    if (!email.trim()) {
      setIsLocked(false);
      return;
    }

    authApi.getLockStatus(email.trim())
      .then((status) => {
        if (status.locked && status.remainingSeconds && status.remainingSeconds > 0) {
          startCountdown(status.remainingSeconds);
        } else {
          setIsLocked(false);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to query lock status', err);
      });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authenticatedUser = await login({ email: email.trim(), password });
      const userRole = (authenticatedUser?.role || '').toUpperCase();

      if (userRole === 'ROLE_HR' || userRole === 'HR') {
        navigate('/hr/dashboard');
      } else if (userRole === 'ROLE_MANAGER' || userRole === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const data = err.response?.data;

      if (err.response?.status === 423 || data?.locked) {
        const remaining = data?.remainingSeconds || 300;
        startCountdown(remaining);
        setError(data?.message || 'Too many failed login attempts. Please try again in 5 minutes.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotNotice(null);

    if (!forgotEmail.trim()) {
      setForgotNotice({ type: 'error', message: 'Corporate email is required.' });
      return;
    }

    if (!validPassword(newPassword)) {
      setForgotNotice({ type: 'error', message: passwordCriteria });
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotNotice({ type: 'error', message: 'New password and confirm password must match.' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.resetPassword({
        token: '',
        newPassword,
        confirmPassword
      });

      setForgotNotice({
        type: 'success',
        message: res.message || 'Password reset successfully! You can now log in with your new password.'
      });

      // Reset form state
      setEmail(forgotEmail.trim());
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotNotice(null);
      }, 2000);
    } catch (err: any) {
      console.error('Reset error:', err);
      setForgotNotice({
        type: 'error',
        message: err.response?.data?.message || 'Unable to reset password. Please check your details.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSendLinkOnly = async () => {
    if (!forgotEmail.trim()) {
      setForgotNotice({ type: 'error', message: 'Corporate email is required to send recovery link.' });
      return;
    }

    setForgotLoading(true);
    setForgotNotice(null);
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      setForgotNotice({
        type: 'success',
        message: res.message || 'If an account exists, password recovery instructions have been sent.'
      });
    } catch (err: any) {
      setForgotNotice({
        type: 'success',
        message: 'If an account exists, password recovery instructions have been sent.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f9f5] flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Decorative Dotted Grid Pattern */}
      <div className="absolute top-8 left-1/3 -translate-x-12 sm:translate-x-4 lg:translate-x-16 grid grid-cols-5 gap-3.5 opacity-35 pointer-events-none select-none z-0">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ))}
      </div>

      {/* Decorative Bottom Green Wave Accent */}
      <div className="absolute -bottom-8 -left-8 w-[380px] sm:w-[520px] lg:w-[680px] h-52 pointer-events-none select-none z-0">
        <svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path
            d="M0 130 C160 130 220 70 380 100 C470 120 540 85 600 130 L600 200 L0 200 Z"
            fill="#1ea855"
          />
        </svg>
      </div>

      {/* Main Full-Screen Viewport Container */}
      <div className="max-w-7xl 2xl:max-w-[1500px] mx-auto w-full px-6 sm:px-10 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 xl:gap-20 relative z-10">

        {/* LEFT COLUMN: Brand Hero & Feature Cards */}
        <div className="w-full lg:w-[55%] flex flex-col justify-between space-y-8 lg:space-y-10 animate-fadeIn">
          {/* Top Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/90 shadow-2xs p-1.5 flex items-center justify-center">
              <img src="/aseuro-logo.png" alt="Aseuro Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">aseuro</span>
          </div>

          {/* Hero Section */}
          <div className="space-y-4 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
              Performance<br />
              Management<br />
              <span className="text-[#1ea855]">Simplified</span>
            </h1>

            {/* Green underline */}
            <div className="w-16 h-1.5 bg-[#1ea855] rounded-full mt-2" />

            <p className="text-xs sm:text-sm xl:text-base text-slate-500 font-normal leading-relaxed pt-2 max-w-lg">
              A centralized platform to manage goals, reviews, feedback and drive continuous growth.
            </p>
          </div>

          {/* 3 Feature Cards */}
          <div className="space-y-3.5 max-w-lg w-full">
            {/* Card 1: Set Goals */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 flex items-center space-x-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:shadow-md transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center shrink-0 border border-emerald-100/70">
                <Target size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">Set Goals</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug">
                  Define clear goals and align with your vision.
                </p>
              </div>
            </div>

            {/* Card 2: Track Progress */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 flex items-center space-x-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:shadow-md transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center shrink-0 border border-emerald-100/70">
                <BarChart2 size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">Track Progress</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug">
                  Monitor performance and measure what matters.
                </p>
              </div>
            </div>

            {/* Card 3: Drive Growth */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 flex items-center space-x-4 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:shadow-md transition-all">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center shrink-0 border border-emerald-100/70">
                <Sparkles size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">Drive Growth</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-snug">
                  Provide feedback and grow together continuously.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Centered Interactive Login Card */}
        <div className="w-full lg:w-[48%] xl:w-[46%] flex items-center justify-center lg:justify-end">
          <div className="bg-white rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 lg:p-12 xl:p-14 w-full max-w-[540px] xl:max-w-[560px] 2xl:max-w-[580px] relative animate-fadeIn">

            {/* Centered Top Official Aseuro Logo */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-emerald-200/90 flex items-center justify-center p-1.5 shadow-2xs">
                <img src="/aseuro-logo.png" alt="Aseuro Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">aseuro</span>
            </div>

            {/* Card Titles */}
            <div className="text-center mt-6 sm:mt-7 mb-7 sm:mb-8">
              <h2 className="text-3xl sm:text-[32px] font-black text-slate-900 tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-sm sm:text-base text-slate-400 font-medium mt-2">
                Sign in to access your account
              </p>
            </div>

            {/* Account Lock Alert Banner with Real-Time Countdown */}
            {isLocked && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-center space-y-1.5 mb-6 animate-slideIn">
                <div className="flex items-center justify-center space-x-1.5 text-xs sm:text-sm font-bold text-amber-900">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <span>Account temporarily locked</span>
                </div>
                <p className="text-xs text-amber-700 font-medium">
                  Too many failed login attempts. Please try again in{' '}
                  <span className="font-mono font-black text-amber-900 text-xs sm:text-sm bg-amber-100/80 px-2 py-0.5 rounded-md">
                    {formatCountdown(countdownSeconds)}
                  </span>
                </p>
              </div>
            )}

            {/* Generic Error Banner */}
            {!isLocked && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-700 font-semibold flex items-center space-x-2.5 mb-6 animate-slideIn">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="relative flex items-center h-[58px] sm:h-[62px] border border-slate-200 rounded-2xl bg-white px-5 focus-within:border-[#1ea855] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-2xs">
                <Mail size={20} className="text-slate-400 shrink-0 mr-3.5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLocked || loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full text-sm sm:text-base text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium disabled:opacity-60"
                />
              </div>

              {/* Password Field */}
              <div className="relative flex items-center h-[58px] sm:h-[62px] border border-slate-200 rounded-2xl bg-white px-5 focus-within:border-[#1ea855] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-2xs">
                <Lock size={20} className="text-amber-500 shrink-0 mr-3.5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked || loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-sm sm:text-base text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 ml-2.5 px-1 py-1 select-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setNewPassword('');
                    setConfirmPassword('');
                    setForgotNotice(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs sm:text-sm font-bold text-[#1ea855] hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLocked || loading}
                  className="w-full h-[60px] sm:h-[64px] bg-[#1ea855] hover:bg-[#188c46] active:scale-[0.99] text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLocked ? (
                    <span>Locked — Try Again Later</span>
                  ) : loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Security / Lock Rings Decorative Element */}
            <div className="mt-8 sm:mt-10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-emerald-100/90 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border border-emerald-200/80 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shadow-xs">
                    <Lock size={15} className="text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer Copyright */}
      <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 pb-4 sm:pb-6 text-[11px] text-slate-400 font-medium text-center sm:text-left relative z-10">
        &copy; {new Date().getFullYear()} Aseuro Technologies. All rights reserved.
      </div>

      {/* Password Recovery & Reset Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slideIn">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1ea855] flex items-center justify-center font-bold border border-emerald-100">
                  <Lock size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Password Recovery</h3>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotNotice(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {forgotNotice && (
                <div className={`p-4 ${forgotNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'} border text-xs font-semibold rounded-2xl flex items-center space-x-2.5 animate-fadeIn`}>
                  {forgotNotice.type === 'success' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  )}
                  <span>{forgotNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter your corporate email address and create a new secure password for your account.
                </p>

                {/* Corporate Email Field */}
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative flex items-center h-[50px] border border-slate-200 rounded-xl bg-white px-3.5 focus-within:border-[#1ea855] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <Mail size={18} className="text-slate-400 shrink-0 mr-2.5" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. employee@aseuro.com"
                      className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Create New Password Field */}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Create New Password
                  </label>
                  <div className="relative flex items-center h-[50px] border border-slate-200 rounded-xl bg-white px-3.5 focus-within:border-[#1ea855] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <Lock size={18} className="text-amber-500 shrink-0 mr-2.5" />
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a new password (min. 8 chars)"
                      className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center h-[50px] border border-slate-200 rounded-xl bg-white px-3.5 focus-within:border-[#1ea855] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <Lock size={18} className="text-amber-500 shrink-0 mr-2.5" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-3 space-y-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-[48px] bg-[#1ea855] hover:bg-[#188c46] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <span>Saving Password...</span>
                    ) : (
                      <>
                        <span>Save New Password</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleSendLinkOnly}
                      disabled={forgotLoading}
                      className="text-[11px] font-semibold text-slate-500 hover:text-[#1ea855] transition-colors"
                    >
                      Send Email Link Instead
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Login;
