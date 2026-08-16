import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleHome';
import { fetchPublicCampuses } from '../services/authService';

const inputClass =
  'titan-dark-input border border-white/15 bg-white/[0.04] text-white placeholder:text-navy-300 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors';
const labelClass = 'text-caption font-semibold text-navy-100';

export default function TrainerRegisterPage() {
  const { user, loading, registerTrainer: submitRegistration } = useAuth();
  const navigate = useNavigate();

  const { data: campuses } = useQuery({ queryKey: ['public-campuses'], queryFn: fetchPublicCampuses });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [campusId, setCampusId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!campusId && campuses?.length) setCampusId(campuses[0]._id);
  }, [campuses, campusId]);

  if (!loading && user) {
    return <Navigate to={getRoleHome(user.role) || '/unauthorized'} replace />;
  }

  const handleSubmit = async (e) => {
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
    if (!campusId) {
      setError('Please select your campus.');
      return;
    }
    setSubmitting(true);
    try {
      await submitRegistration({ name, email, password, phone, course, campus_id: campusId });
      navigate('/trainer/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-navy-900 font-sans px-4 overflow-hidden py-10">
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
        className="relative w-full max-w-[440px] bg-white/[0.03] backdrop-blur-xl border border-gold-500/20 rounded-xl p-[34px] flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-[160px]">
            <img
              src="/logo.png"
              alt="TITAN — Taj Institute of Technology &amp; Applied Networks"
              className="w-full h-auto object-contain drop-shadow-[0_6px_18px_rgba(201,162,39,0.45)]"
            />
          </div>
          <div className="text-caption text-navy-300 font-normal mt-1">Trainer Portal — Create Account</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>Full Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@titan.edu" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-1234567" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="course" className={labelClass}>Course you teach</label>
              <input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. Web Development" className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="campus" className={labelClass}>Campus</label>
            <select
              id="campus"
              required
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              {!campuses?.length && <option value="">Loading campuses…</option>}
              {campuses?.map((c) => (
                <option key={c._id} value={c._id} className="bg-navy-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="text-caption text-danger-600 bg-surface border border-danger-200 rounded px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 transition-all hover:shadow-[0_8px_24px_rgba(201,162,39,0.4)] hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>

          <Link to="/login" className="text-center text-caption text-navy-300 hover:text-gold-400 transition-colors">
            Already have an account? Sign in
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
