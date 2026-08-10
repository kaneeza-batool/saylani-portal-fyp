import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_LOOKUP as ADMIN_NAV_LOOKUP } from './Sidebar';
import { NAV_LOOKUP as TRAINER_NAV_LOOKUP } from './TrainerSidebar';
import { useAuth } from '../context/AuthContext';

const NAV_LOOKUP = { ...ADMIN_NAV_LOOKUP, ...TRAINER_NAV_LOOKUP };

function useViewTitle() {
  const { pathname } = useLocation();
  return NAV_LOOKUP[pathname] ?? 'Dashboard';
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

function roleLabel(role) {
  return (role || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function TopBar() {
  const title = useViewTitle();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-[66px] shrink-0 bg-white border-b-2 border-royal-500 flex items-center justify-between px-[26px] sticky top-0 z-[5]">
      <div className="font-heading font-bold text-h4 text-royal-700">{title}</div>

      <div className="flex items-center gap-[18px]">
        <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[260px] focus-within:border-royal-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search across Saylani..."
            className="border-none bg-transparent outline-none text-body-sm text-neutral-900 w-full font-sans"
          />
        </div>

        <div className="relative cursor-pointer w-5 h-5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          <div className="absolute -top-[3px] -right-[3px] w-[9px] h-[9px] rounded-full bg-royal-500 border-2 border-white" />
        </div>

        <div className="w-px h-[26px] bg-neutral-200" />

        <div className="group relative flex items-center gap-2.5 cursor-pointer">
          <div className="w-[34px] h-[34px] rounded-full bg-parrot-500 text-white flex items-center justify-center font-heading font-bold text-[13px]">
            {initials(user?.name)}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-neutral-900 leading-[1.2]">{user?.name ?? 'Loading...'}</div>
            <div className="text-[11px] text-neutral-400">{roleLabel(user?.role) || '—'}</div>
          </div>

          <div className="absolute right-0 top-[calc(100%+8px)] hidden group-hover:block bg-white border border-neutral-200 rounded shadow-panel py-1.5 min-w-[140px] z-10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3.5 py-2 text-body-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
