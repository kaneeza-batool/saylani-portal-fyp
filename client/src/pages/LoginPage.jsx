import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '/images/logo/titan-logo-clean.png';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';
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
          {visible ? <EyeOffIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(cnic, password);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
        type="submit"
        disabled={submitting}
        className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>
      <button
        type="button"
        className="text-sm font-semibold text-neutral-500 hover:text-neutral-700 text-center mt-1"
      >
        Login as teacher
      </button>
    </form>
  );
}

function CreatePasswordForm() {
  const { completeSetPassword } = useAuth();
  const navigate = useNavigate();
  const [cnic, setCnic] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setVerifying(true);
    try {
      const { hasPassword } = await authService.verifyCnic(cnic);
      if (hasPassword) {
        setInfo('This account already has a password. Please use the Login tab instead.');
        setVerified(false);
      } else {
        setVerified(true);
      }
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
    setSubmitting(true);
    try {
      await completeSetPassword(cnic, password);
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
        {info && (
          <div className="rounded-md bg-info-bg text-info-text text-sm font-medium px-3.5 py-2.5">{info}</div>
        )}
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
      <div className="rounded-md bg-success-bg text-success-text text-sm font-medium px-3.5 py-2.5">
        CNIC verified. Choose a password to finish setting up your account.
      </div>
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
        {submitting ? 'Setting password...' : 'Set Password'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <div className="flex flex-col items-center gap-2">
        <img src={logo} alt="TITAN" className="w-16 h-16 object-contain" />
        <h1 className="font-heading text-xl font-bold text-primary-800">Student Portal</h1>
      </div>

      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-card p-8">
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
      </div>
    </div>
  );
}
