import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getMyEmployerProfile } from '../../services/employerPortalService';

const inputClass = 'border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500 bg-surface text-neutral-900';
const labelClass = 'text-caption font-semibold text-neutral-600';

const STATUS_STYLE = {
  pending: { label: 'Pending Verification', className: 'bg-warning-bg text-warning-text' },
  verified: { label: 'Verified', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const { data: employer, isLoading: employerLoading } = useQuery({
    queryKey: ['employer-my-profile'],
    queryFn: getMyEmployerProfile,
  });

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await updateProfile(payload);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = employer ? STATUS_STYLE[employer.status] : null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start">
      <motion.div variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="font-heading font-bold text-h6 text-neutral-900">Company Profile</div>
          <button
            type="button"
            onClick={handleLogout}
            className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer hover:bg-gold-600"
          >
            Logout
          </button>
        </div>

        {employerLoading ? (
          <div className="h-24 bg-neutral-100 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-overline uppercase text-neutral-500">Status</span>
              {statusInfo && <span className={`text-caption font-semibold px-3 py-1 rounded-pill ${statusInfo.className}`}>{statusInfo.label}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-overline uppercase text-neutral-500">Company Name</span>
              <span className="text-body-sm text-neutral-900">{employer?.companyName || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-overline uppercase text-neutral-500">Contact Phone</span>
              <span className="text-body-sm text-neutral-900">{employer?.contactPhone || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-overline uppercase text-neutral-500">City</span>
              <span className="text-body-sm text-neutral-900">{employer?.city || '—'}</span>
            </div>
          </>
        )}
      </motion.div>

      <motion.div variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">Account Settings</div>
          <div className="text-body-sm text-neutral-400 mt-0.5">Update your login name, email, or password.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-name">Full name</label>
            <input id="profile-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="h-px bg-neutral-100 my-1" />

          <div className="text-caption font-semibold text-neutral-600">Change password (optional)</div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-current-password">Current password</label>
            <input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required only if setting a new password"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-new-password">New password</label>
            <input
              id="profile-new-password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {message && (
            <div
              className={`text-caption rounded px-3 py-2 border ${
                message.type === 'success' ? 'text-success-text bg-success-bg border-success-bg' : 'text-danger-600 bg-danger-50 border-danger-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 self-start border-none bg-gold-500 text-white text-body-sm font-semibold px-6 py-[11px] rounded cursor-pointer hover:bg-gold-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
