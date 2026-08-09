import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function roleLabel(role) {
  return (role || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const STATUS_STYLE = {
  active: 'bg-success-bg text-success-text',
  inactive: 'bg-neutral-100 text-neutral-500',
  suspended: 'bg-danger-50 text-danger-600',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-[560px]">
      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="font-heading font-bold text-h6 text-neutral-900">Profile Information</div>
          <button
            type="button"
            onClick={handleLogout}
            className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Logout
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h5 shrink-0 border border-gold-500/40">
            {initials(user?.name)}
          </div>
          <div>
            <div className="font-heading font-bold text-h6 text-neutral-900">{user?.name}</div>
            <div className="text-body-sm text-neutral-400">{user?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Role</span>
            <span className="text-badge px-2.5 py-1 rounded-pill w-fit bg-info-bg text-info-text">{roleLabel(user?.role)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Status</span>
            <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${STATUS_STYLE[user?.status] ?? STATUS_STYLE.active}`}>
              {(user?.status || 'active').charAt(0).toUpperCase() + (user?.status || 'active').slice(1)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Campus</span>
            <span className="text-body-sm text-neutral-900">{user?.campus_id?.name || user?.campus_id || 'Unassigned'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
