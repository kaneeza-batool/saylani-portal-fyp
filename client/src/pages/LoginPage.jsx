import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getRoleHome, isRouteAllowedForRole } from '../utils/roleHome';

// `location.state.from` is only trustworthy when it's a route the CURRENT
// user's role can actually reach — it was set by ProtectedRoute for
// whichever user/role was signed in at the time (possibly a different one:
// logging out from an allowed-for-both page like /admin/profile and back in
// as a different role carries that stale state across the login boundary).
// Falls back to the fresh user's own role home otherwise.
function resolveRedirect(pathname, role) {
  return (pathname && isRouteAllowedForRole(pathname, role) ? pathname : null) || getRoleHome(role) || '/unauthorized';
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={resolveRedirect(location.state?.from?.pathname, user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(resolveRedirect(location.state?.from?.pathname, loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-navy-900 font-sans px-4 overflow-hidden">
      {/* Ambient navy backdrop with a slow-drifting gold glow — subtle, not distracting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#12234A_0%,_#080F22_70%)]" />
        <motion.div
          className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-gold-500/10 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-navy-500/20 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#C9A227 1px, transparent 1px), linear-gradient(90deg, #C9A227 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[400px] bg-white/[0.03] backdrop-blur-xl border border-gold-500/20 rounded-xl p-[34px] flex flex-col gap-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="w-[180px]"
          >
            <img
              src="/logo.png"
              alt="TITAN — Taj Institute of Technology &amp; Applied Networks"
              className="w-full h-auto object-contain drop-shadow-[0_6px_18px_rgba(201,162,39,0.45)]"
            />
          </motion.div>
          <div className="text-caption text-navy-300 font-normal mt-1">Super Admin Portal</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-caption font-semibold text-navy-100">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@titan.edu"
              className="titan-dark-input border border-white/15 bg-white/[0.04] text-white placeholder:text-navy-300 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-caption font-semibold text-navy-100">
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
              className="titan-dark-input border border-white/15 bg-white/[0.04] text-white placeholder:text-navy-300 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          {error && (
            <div className="text-caption text-danger-600 bg-surface border border-danger-200 rounded px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 transition-all hover:shadow-[0_8px_24px_rgba(201,162,39,0.4)] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
