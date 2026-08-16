import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import titanLogo from '../../assets/titan-logo.png';

/* ============================================================
   TITAN — Admin Login (/admin/login)
   Standalone, no public Navbar/Footer. Single hardcoded admin account,
   JWT via httpOnly cookie — not connected to Student Portal / Super Admin.
   Same dark navy + gold visual language as the main app's Super
   Admin/Sub-Admin/Trainer login (client/src/pages/LoginPage.jsx) — kept in
   sync by eye since this app has its own separate Tailwind theme tokens
   (primary-* for navy, accent-* for gold, no shared component library).
   ============================================================ */

const inputClass =
  'border border-white/15 bg-white/[0.04] text-white placeholder:text-primary-300 rounded px-3 py-[10px] text-sm outline-none focus:border-accent-500 transition-colors';
const labelClass = 'text-xs font-semibold text-primary-100';

const AdminLogin = () => {
  const { admin, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-primary-900 px-4 overflow-hidden">
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

      <div className="relative w-full max-w-[400px] bg-white/[0.03] backdrop-blur-xl border border-accent-500/20 rounded-xl p-[34px] flex flex-col gap-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-admin-card-in">
        <div className="flex flex-col items-center gap-2">
          <div className="w-[180px]">
            <img
              src={titanLogo}
              alt="TITAN — Taj Institute of Technology &amp; Applied Networks"
              className="w-full h-auto object-contain drop-shadow-[0_6px_18px_rgba(206,164,92,0.45)]"
            />
          </div>
          <div className="text-sm text-primary-300 font-normal mt-1">Sign in to your account</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@titan.edu.pk"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="text-xs text-danger-text bg-danger-bg border border-danger-text/20 rounded px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-sm font-semibold bg-gradient-to-r from-accent-400 to-accent-600 text-primary-900 transition-all hover:shadow-[0_8px_24px_rgba(206,164,92,0.4)] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? 'Signing In...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
