import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  isMandatory?: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onSuccess,
  isMandatory = true,
}) => {
  const { updateUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time password validation indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setError('Current password is required.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!hasUpper) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!hasLower) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }

    if (!hasDigit) {
      setError('Password must contain at least one number (0-9).');
      return;
    }

    if (!hasSpecial) {
      setError('Password must contain at least one special character (e.g. !@#$%^&*).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setError('New password cannot be the same as current password.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      setSuccessMessage(response.message || 'Password changed successfully! Redirecting to dashboard...');

      setTimeout(() => {
        updateUser({ mustChangePassword: false });
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update password. Please check your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all"
      aria-modal="true"
      role="dialog"
      aria-labelledby="reset-password-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Security Badge */}
        <div className="bg-gradient-to-r from-pms-darkGreen to-pms-gray p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner">
            <KeyRound className="w-7 h-7 text-pms-lightGreen" />
          </div>
          <h2 id="reset-password-title" className="text-xl font-bold tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
            For security, you must reset your temporary password before continuing.
          </p>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="flex items-start space-x-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start space-x-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Temporary Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="current-password-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current temporary password"
                  disabled={loading || !!successMessage}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pms-green focus:border-transparent transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Permanent Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong new password"
                  disabled={loading || !!successMessage}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pms-green focus:border-transparent transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={loading || !!successMessage}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pms-green focus:border-transparent transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Live Security Policy / Criteria Checkers */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Password Security Checklist:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>1 uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasLower ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>1 lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasDigit ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>1 number (0-9)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>1 special character (@, #, etc.)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="submit"
                id="reset-password-submit-btn"
                disabled={loading || !!successMessage}
                className="flex-1 py-3 px-4 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Logout link option if user wants to cancel and log out */}
            {isMandatory && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium underline underline-offset-2"
                >
                  Log Out & Try Later
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
