import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { NAV_LOOKUP } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useSocketData } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useCommandPalette } from '../context/CommandPaletteContext';

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

export default function TopBar({ onMenuClick = () => {} }) {
  const title = useViewTitle();
  const { user, logout } = useAuth();
  const { connected, liveAlerts, unreadAlertCount, clearUnread } = useSocketData();
  const { theme, toggleTheme } = useTheme();
  const { openPalette } = useCommandPalette();
  const navigate = useNavigate();
  const bellControls = useAnimation();
  const prevUnreadRef = useRef(unreadAlertCount);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const alertsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (unreadAlertCount > prevUnreadRef.current) {
      bellControls.start({
        rotate: [0, -14, 12, -8, 0],
        scale: [1, 1.15, 1],
        transition: { duration: 0.5, ease: 'easeInOut' },
      });
    }
    prevUnreadRef.current = unreadAlertCount;
  }, [unreadAlertCount, bellControls]);

  // Click-toggle instead of CSS :hover — hover-only dropdowns silently fail
  // on touch devices (no hover state exists) and are flaky on desktop too
  // (the dropdown can vanish mid-move before the pointer reaches it).
  useEffect(() => {
    function handleClickOutside(e) {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const goToAlerts = () => {
    clearUnread();
    setAlertsOpen(false);
    navigate(user?.role === 'sub_admin' ? '/sub-admin/alerts' : '/admin/alerts');
  };

  return (
    <div className="h-[66px] shrink-0 bg-surface flex items-center justify-between px-4 sm:px-[26px] sticky top-0 z-[5] gap-3">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-500 overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-gold-200 to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden shrink-0 w-9 h-9 border border-neutral-200 bg-neutral-100 rounded flex items-center justify-center cursor-pointer transition-colors hover:bg-neutral-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="font-heading font-bold text-h4 text-gold-700 truncate">{title}</div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-[18px]">
        <button
          type="button"
          onClick={openPalette}
          className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-2.5 sm:px-3 py-2 w-9 sm:w-[260px] justify-center sm:justify-start cursor-pointer transition-colors hover:border-gold-500 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="hidden sm:block flex-1 text-left text-body-sm text-neutral-400 font-sans">Search across TITAN...</span>
          <span className="hidden sm:block text-badge text-neutral-400 font-normal border border-neutral-200 rounded px-1.5 py-0.5 shrink-0">Ctrl K</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative w-9 h-9 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center cursor-pointer overflow-hidden transition-colors hover:bg-neutral-200 shrink-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.svg
                key="sun"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9A227"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </motion.svg>
            ) : (
              <motion.svg
                key="moon"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#12234A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        <div ref={alertsRef} className="relative cursor-pointer w-5 h-5">
          <motion.button
            type="button"
            onClick={() => setAlertsOpen((o) => !o)}
            animate={bellControls}
            className="block w-5 h-5 border-none bg-transparent cursor-pointer p-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
            <AnimatePresence>
              {unreadAlertCount > 0 && (
                <motion.div
                  key={unreadAlertCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute -top-[3px] -right-[3px] min-w-[14px] h-[14px] px-[3px] rounded-full bg-danger-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white leading-none"
                >
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {alertsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-[calc(100%+8px)] bg-surface border border-neutral-200 rounded shadow-panel py-1.5 w-[280px] max-w-[85vw] z-10 overflow-hidden"
              >
                <div className="px-3.5 py-1.5 text-caption font-semibold text-neutral-500">Recent Alerts</div>
                {liveAlerts.length === 0 ? (
                  <div className="px-3.5 py-2 text-body-sm text-neutral-400">No new alerts.</div>
                ) : (
                  <AnimatePresence initial={false}>
                    {liveAlerts.slice(0, 5).map((a) => (
                      <motion.div
                        key={a._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="px-3.5 py-2 text-body-sm text-neutral-700 border-t border-neutral-100 truncate"
                      >
                        {a.message}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <button
                  type="button"
                  onClick={goToAlerts}
                  className="w-full text-left px-3.5 py-2 text-caption font-semibold text-gold-600 hover:bg-neutral-100 transition-colors border-t border-neutral-100"
                >
                  View all alerts
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-1.5" title={connected ? 'Live — connected' : 'Offline'}>
          <span className="relative w-[7px] h-[7px]">
            <span className={`absolute inset-0 rounded-full ${connected ? 'bg-success-text' : 'bg-neutral-300'}`} />
            {connected && (
              <motion.span
                className="absolute inset-0 rounded-full bg-success-text"
                animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </span>
          <span className="text-badge text-neutral-400 font-normal">{connected ? 'Live' : 'Offline'}</span>
        </div>

        <div className="w-px h-[26px] bg-neutral-200" />

        <div ref={userMenuRef} className="relative flex items-center gap-2.5 cursor-pointer" onClick={() => setUserMenuOpen((o) => !o)}>
          <div className="w-[34px] h-[34px] rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-[13px] border border-gold-500/40 shrink-0">
            {initials(user?.name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-semibold text-neutral-900 leading-[1.2]">{user?.name ?? 'Loading...'}</div>
            <div className="text-[11px] text-neutral-400">{roleLabel(user?.role) || '—'}</div>
          </div>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-[calc(100%+8px)] bg-surface border border-neutral-200 rounded shadow-panel py-1.5 min-w-[140px] z-10"
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2 text-body-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
