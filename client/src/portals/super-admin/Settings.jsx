import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const inputClass =
  'border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-royal-500 transition-colors';
const labelClass = 'text-caption font-semibold text-neutral-600';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-[560px]">
      <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">Account Settings</div>
          <div className="text-body-sm text-neutral-400 mt-0.5">Update your name, email, or password.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="settings-name">
              Full name
            </label>
            <input id="settings-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="settings-email">
              Email
            </label>
            <input id="settings-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="h-px bg-neutral-100 my-1" />

          <div className="text-caption font-semibold text-neutral-600">Change password (optional)</div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="settings-current-password">
              Current password
            </label>
            <input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required only if setting a new password"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="settings-new-password">
              New password
            </label>
            <input
              id="settings-new-password"
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
            className="mt-1 self-start border-none bg-royal-500 text-white text-body-sm font-semibold px-4.5 py-[10px] rounded cursor-pointer transition-colors hover:bg-royal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
