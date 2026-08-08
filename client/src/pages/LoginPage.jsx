import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 font-sans px-4">
      <div className="w-full max-w-[380px] bg-white border border-neutral-200 rounded-xl p-[30px] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-[52px] h-[52px] rounded-full bg-white border border-neutral-200 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-parrot-500"
            >
              <path d="M12 3c4 2 6 5 6 9a6 6 0 0 1-12 0c0-4 2-7 6-9z" />
              <path d="M12 9v9" />
            </svg>
          </div>
          <div className="font-heading font-bold text-h5">
            <span className="text-parrot-500">Sayl</span>
            <span className="text-royal-500">ani</span>
          </div>
          <div className="text-body-sm text-neutral-400 -mt-2">Sign in to the admin portal</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-caption font-semibold text-neutral-600">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@saylani.org"
              className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-royal-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-caption font-semibold text-neutral-600">
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
              className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-royal-500 transition-colors"
            />
          </div>

          {error && (
            <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-royal-500 text-white transition-colors hover:bg-royal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
