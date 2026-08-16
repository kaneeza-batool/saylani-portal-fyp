import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import titanLogo from '../../assets/titan-logo-auth.png';

/* ============================================================
   TITAN — Admin Login (/admin/login)
   Standalone, no public Navbar/Footer. Single hardcoded admin account,
   JWT via httpOnly cookie — not connected to Student Portal / Super Admin.
   Same dark navy + gold visual language as the main app's Super
   Admin/Sub-Admin/Trainer login (client/src/pages/LoginPage.jsx) — kept in
   sync by eye since this app has its own separate Tailwind theme tokens
   (primary-* for navy, accent-* for gold, no shared component library,
   and no framer-motion dependency — field stagger is CSS-animation-delay
   based instead of framer-motion variants).
   ============================================================ */

const inputClass =
  'w-full border border-white/15 bg-white/[0.04] text-white placeholder:text-primary-300 rounded px-3 py-[10px] text-sm outline-none focus:border-accent-500 focus:shadow-[0_0_0_3px_rgba(206,164,92,0.15)] transition-all';
const labelClass = 'text-xs font-semibold text-primary-100';

function EyeIcon({ off }) {
  return off ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.4 4.3M6.3 6.5C3.9 8.1 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.6-.7" />
      <path d="M9.5 10a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const AdminLogin = () => {
  const { admin, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-primary-900 px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1D3557_0%,_#0A1530_70%)]" />
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-accent-500/10 blur-[120px] animate-admin-drift-1" />
        <div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-primary-500/20 blur-[120px] animate-admin-drift-2" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#CEA45C 1px, transparent 1px), linear-gradient(90deg, #CEA45C 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative w-full max-w-[380px] my-auto bg-white/[0.03] backdrop-blur-xl border border-accent-500/20 rounded-xl px-7 py-6 flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-admin-card-in">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-[150px] animate-admin-field-in transition-transform hover:scale-105" style={{ animationDelay: '60ms' }}>
            <img src={titanLogo} alt="TITAN — Taj Institute of Technology &amp; Applied Networks" className="w-full h-auto object-contain drop-shadow-[0_6px_18px_rgba(206,164,92,0.45)]" />
          </div>
          <div className="text-sm text-primary-300 font-normal mt-1 animate-admin-field-in" style={{ animationDelay: '160ms' }}>
            Sign in to your account
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 animate-admin-field-in" style={{ animationDelay: '210ms' }}>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <div className="relative">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300 pointer-events-none"
              >
                <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                <path d="M3 6.5l9 6 9-6" />
              </svg>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@titan.edu.pk"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 animate-admin-field-in" style={{ animationDelay: '260ms' }}>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((v) => !v)}
                tabIndex={-1}
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-accent-400 transition-colors"
              >
                <EyeIcon off={passwordVisible} />
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-danger-text bg-danger-bg border border-danger-text/20 rounded px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-sm font-semibold bg-gradient-to-r from-accent-400 to-accent-600 text-primary-900 transition-all hover:shadow-[0_8px_24px_rgba(206,164,92,0.4)] hover:scale-[1.015] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 animate-admin-field-in"
            style={{ animationDelay: '310ms' }}
          >
            {submitting ? 'Signing In...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
