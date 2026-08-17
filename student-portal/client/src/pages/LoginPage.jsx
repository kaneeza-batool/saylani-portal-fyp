import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '/images/logo/titan-logo-clean.png';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { EyeIcon, EyeOffIcon } from '../components/icons';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{message}</div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputClass} pr-10`}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Always /courses — ProtectedRoute redirects from there to whichever
      // of onboarding/pending-approval/courses actually applies, so this
      // page doesn't need to duplicate that branching.
      await login(cnic, password);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Fragment, not a shared wrapper div — ForgotPasswordModal renders its
    // own <form> internally, and nesting a <form> inside this one would be
    // invalid HTML (React doesn't auto-correct that the way raw HTML
    // parsing does), so it has to be a sibling of <form>, not a child.
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ErrorBanner message={error} />
      <div>
        <label className={labelClass}>CNIC</label>
        <input
          type="text"
          value={cnic}
          onChange={(e) => setCnic(e.target.value)}
          placeholder="4550476281307"
          className={inputClass}
          required
        />
      </div>
      <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
      <button
        type="button"
        onClick={() => setForgotOpen(true)}
        className="text-sm font-semibold text-primary-800 hover:text-primary-900 text-right -mt-2"
      >
        Forgot Password?
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>
      {/* Trainer portal isn't built yet (super-admin-portal is still
          scaffold-only) — disabled rather than a dead click, so it reads as
          "not available yet" instead of silently doing nothing. */}
      <button
        type="button"
        disabled
        title="Trainer login is coming soon"
        className="text-sm font-semibold text-neutral-400 text-center mt-1 cursor-not-allowed"
      >
        Login as teacher (coming soon)
      </button>
    </form>
    <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

function CreatePasswordForm() {
  const { completeSetPassword } = useAuth();
  const navigate = useNavigate();
  const [cnic, setCnic] = useState('');
  const [verified, setVerified] = useState(false);
  // Whether this CNIC's account already has a password — determines whether
  // the next step asks for a phone number too (recreation) or not
  // (first-time setup). See authController.setPassword for why: a CNIC
  // alone is never enough to overwrite an existing password.
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const { hasPassword } = await authService.verifyCnic(cnic);
      setHasExistingPassword(hasPassword);
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'CNIC verification failed.');
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (hasExistingPassword && !phone.trim()) {
      setError('Enter the phone number on file to create a new password.');
      return;
    }
    setSubmitting(true);
    try {
      // Real session either way now (see authController.setPassword) —
      // ProtectedRoute sends them to onboarding first, then to
      // pending-approval or courses depending on portalAccess.
      await completeSetPassword(cnic, password, hasExistingPassword ? phone : undefined);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!verified) {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <ErrorBanner message={error} />
        <div>
          <label className={labelClass}>CNIC</label>
          <input
            type="text"
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
            placeholder="4550476281307"
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {verifying ? 'Verifying...' : 'Verify CNIC'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
      <ErrorBanner message={error} />
      {hasExistingPassword ? (
        <div className="rounded-md bg-info-bg text-info-text text-sm font-medium px-3.5 py-2.5">
          This account already has a password. Confirm the phone number on file to replace it — your profile,
          attendance, fees, and quiz history all stay exactly as they are.
        </div>
      ) : (
        <div className="rounded-md bg-success-bg text-success-text text-sm font-medium px-3.5 py-2.5">
          CNIC verified. Choose a password to finish setting up your account.
        </div>
      )}
      {hasExistingPassword && (
        <div>
          <label className={labelClass}>Phone number on file</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03001234567"
            className={inputClass}
            required
          />
        </div>
      )}
      <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      <PasswordField
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter password"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? 'Setting password...' : hasExistingPassword ? 'Replace Password' : 'Set Password'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center gap-2"
      >
        <img src={logo} alt="TITAN" className="w-16 h-16 object-contain" />
        <h1 className="font-heading text-xl font-bold text-primary-800">Student Portal</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-card p-8">
        <div className="flex rounded-md bg-neutral-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tab === 'login' ? 'bg-primary-800 text-white' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tab === 'create' ? 'bg-primary-800 text-white' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Create Password
          </button>
        </div>

        {tab === 'login' ? <LoginForm /> : <CreatePasswordForm />}
      </motion.div>
    </div>
  );
}
