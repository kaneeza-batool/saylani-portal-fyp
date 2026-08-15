import { useState } from 'react';
import titanLogo from '../../assets/titan-logo.png';

const STUDENT_PORTAL_URL = import.meta.env.VITE_STUDENT_PORTAL_URL || 'http://localhost:5273/login';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

const eyeIconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

function EyeIcon(props) {
  return (
    <svg {...eyeIconBase} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg {...eyeIconBase} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.4 4.3M6.3 6.5C3.9 8.1 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.6-.7" />
      <path d="M9.5 10a3 3 0 0 0 4.2 4.2" />
    </svg>
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

// This site and Student Portal are separate standalone apps with separate
// backends/databases — there's nothing to authenticate against here, so
// submitting either tab just redirects to the real Student Portal login.
function redirectToStudentPortal() {
  window.location.href = STUDENT_PORTAL_URL;
}

function LoginForm() {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); redirectToStudentPortal(); }} className="flex flex-col gap-4">
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
        className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 mt-2"
      >
        Login
      </button>
    </form>
  );
}

function CreatePasswordForm() {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); redirectToStudentPortal(); }} className="flex flex-col gap-4">
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
      <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      <PasswordField label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
      <button
        type="submit"
        className="w-full rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide bg-primary-800 text-white transition-colors hover:bg-primary-900 mt-2"
      >
        Create Password
      </button>
    </form>
  );
}

const Login = () => {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-neutral-50 px-4 py-16">
      <div className="flex flex-col items-center gap-2">
        <img src={titanLogo} alt="TITAN" className="w-16 h-16 object-contain" />
        <h1 className="font-heading text-xl font-bold text-primary-800">Student Portal</h1>
      </div>

      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-md p-8">
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

        <p className="mt-5 text-xs text-center text-neutral-500">
          You'll be redirected to the Student Portal to sign in
        </p>
      </div>
    </div>
  );
};

export default Login;
