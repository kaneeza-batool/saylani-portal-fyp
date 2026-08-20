import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { verifyTrainerCnic, resetTrainerPasswordByCnic } from '../services/authService';
import DarkPasswordField from '../components/DarkPasswordField';

const inputClass =
  'titan-dark-input w-full border border-white/15 bg-white/[0.04] text-white placeholder:text-navy-300 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 focus:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] transition-all';
const labelClass = 'text-caption font-semibold text-navy-100';

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } };

// A trainer never creates their own account (see removed self-registration
// flow) — Super Admin/Sub-Admin's "+ Add Trainer" mints the first password
// and shares it directly. This page is only for recovering access to that
// same account: CNIC identifies the trainer, phone is the second factor
// that proves it's actually them, matching the two-factor bar student-
// portal already uses for its own "already has a password" reset case
// (see student-portal/server/controllers/authController.setPassword).
export default function TrainerForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('cnic'); // 'cnic' | 'reset' | 'done'
  const [cnic, setCnic] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await verifyTrainerCnic(cnic);
      setName(result.name);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify that CNIC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetTrainerPasswordByCnic({ cnic, phone, newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-navy-900 font-sans px-4 py-12 overflow-hidden">
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[380px] my-auto bg-white/[0.03] backdrop-blur-xl border border-gold-500/20 rounded-xl px-7 py-6 flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-[150px]">
            <img src="/logo-auth.png" alt="TITAN" className="w-full h-auto object-contain drop-shadow-[0_6px_18px_rgba(201,162,39,0.45)]" />
          </div>
          <div className="text-body-sm text-navy-300 font-normal mt-1 text-center">
            {step === 'done' ? 'Password updated' : 'Reset your trainer password'}
          </div>
        </div>

        {step === 'cnic' && (
          <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleVerify} className="flex flex-col gap-4">
            <motion.div variants={fieldVariants} className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="cnic">
                CNIC
              </label>
              <input
                id="cnic"
                type="text"
                required
                placeholder="12345-1234567-1"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className={inputClass}
              />
            </motion.div>

            {error && (
              <motion.div className="text-caption text-danger-600 bg-surface border border-danger-200 rounded px-3 py-2">{error}</motion.div>
            )}

            <motion.button
              variants={fieldVariants}
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 transition-shadow hover:shadow-[0_8px_24px_rgba(201,162,39,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Checking...' : 'Continue'}
            </motion.button>

            <motion.div variants={fieldVariants}>
              <Link to="/login" className="block text-center text-caption text-navy-300 hover:text-gold-400 transition-colors">
                Back to sign in
              </Link>
            </motion.div>
          </motion.form>
        )}

        {step === 'reset' && (
          <motion.form variants={staggerContainer} initial="hidden" animate="show" onSubmit={handleReset} className="flex flex-col gap-4">
            <motion.div variants={fieldVariants} className="text-body-sm text-navy-100 text-center -mt-2">
              Hi {name} — confirm your phone number and set a new password.
            </motion.div>

            <motion.div variants={fieldVariants} className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="phone">
                Phone number on file
              </label>
              <input id="phone" type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </motion.div>

            <motion.div variants={fieldVariants} className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="newPassword">
                New password
              </label>
              <DarkPasswordField
                id="newPassword"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </motion.div>

            <motion.div variants={fieldVariants} className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="confirmPassword">
                Confirm password
              </label>
              <DarkPasswordField
                id="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </motion.div>

            {error && (
              <motion.div className="text-caption text-danger-600 bg-surface border border-danger-200 rounded px-3 py-2">{error}</motion.div>
            )}

            <motion.button
              variants={fieldVariants}
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 transition-shadow hover:shadow-[0_8px_24px_rgba(201,162,39,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update password'}
            </motion.button>
          </motion.form>
        )}

        {step === 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
            <div className="text-body-sm text-navy-100 text-center">
              Your password has been updated. You can sign in with it now.
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 rounded px-4 py-[11px] text-body font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 transition-shadow hover:shadow-[0_8px_24px_rgba(201,162,39,0.4)]"
            >
              Go to sign in
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
