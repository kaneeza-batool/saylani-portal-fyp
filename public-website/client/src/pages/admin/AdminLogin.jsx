import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

/* ============================================================
   TITAN — Admin Login (/admin/login)
   Standalone, no public Navbar/Footer. Single hardcoded admin account,
   JWT via httpOnly cookie — not connected to Student Portal / Super Admin.
   ============================================================ */

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
    <div className="min-h-screen flex items-center justify-center bg-primary-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <p className="te-mono text-xs font-bold uppercase tracking-widest text-accent-600 mb-1">TITAN Admin</p>
        <h1 className="text-2xl font-extrabold text-neutral-900">Admin Login</h1>
        <p className="text-sm text-neutral-500 mt-1">Sign in to manage the course catalog.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-3 text-sm outline-none transition-colors focus:border-primary-800"
              placeholder="admin@titan.edu.pk"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-3 text-sm outline-none transition-colors focus:border-primary-800"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-danger-text">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-900 text-white font-bold text-sm rounded-lg p-3 hover:bg-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
