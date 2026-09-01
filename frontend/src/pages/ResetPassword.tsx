import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import aseuroLogo from '../assets/aseuro-logo.png';

interface Notice { type: 'error' | 'success'; message: string; }

const passwordCriteria = 'Password should contain minimum 8 characters with alphabets, numbers and special characters.';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (!t) {
      setNotice({ type: 'error', message: 'Invalid password reset link.' });
    } else {
      setToken(t);
    }
  }, [location.search]);

  const validPassword = (val: string) =>
    val.length >= 8 && /[a-zA-Z]/.test(val) && /\d/.test(val) && /[^a-zA-Z\d]/.test(val);

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!validPassword(newPassword)) return setNotice({ type: 'error', message: passwordCriteria });
    if (newPassword !== confirmPassword) return setNotice({ type: 'error', message: 'Passwords do not match.' });
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword, confirmPassword });
      setNotice({ type: 'success', message: 'Password reset successfully. Redirecting to login...' });
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="dot-grid-matrix" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => <span key={i} className="dot" />)}</div>
      <div className="login-layout-container">
        <section className="left-hero-section">
          <div className="brand-header"><span className="logo-glow"><img src={aseuroLogo} alt="Aseuro Logo" className="aseuro-logo-img" /></span><span className="brand-title">aseuro</span></div>
          <div className="hero-headings"><h1>Reset Your<br />Password</h1><div className="green-accent-line" /><p className="hero-subtext">Create a new secure password for your account.</p></div>
        </section>
        <section className="right-card-section">
          <div className="login-card-box">
            <div className="card-brand-header"><span className="logo-glow small"><img src={aseuroLogo} alt="Aseuro Logo" className="card-logo-img" /></span><span className="card-brand-text">aseuro</span></div>
            <h2 className="card-title">Reset Password</h2>
            <form className="auth-form-body" onSubmit={reset}>
              <div className="styled-input-wrap"><span className="input-prefix-icon">🔒</span><input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
              <div className="styled-input-wrap"><span className="input-prefix-icon">🔒</span><input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
              <button type="submit" className="green-login-btn" disabled={loading}>{loading ? 'Please wait…' : 'Reset Password'}</button>
              {notice && (
                <div className={`auth-toast ${notice.type}`} role="alert"><span>{notice.type === 'success' ? '✓' : '!'} </span>{notice.message}</div>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
