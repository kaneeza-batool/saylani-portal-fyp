import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileIcon, LogOutIcon } from './icons';

// Shared "Profile / Log out" dropdown — used by both the Sidebar's bottom
// avatar chip (direction="up", panel opens above the trigger since it sits
// at the bottom of the screen) and the TopBar's avatar (direction="down").
// Reused rather than duplicated so both locations can never drift out of
// sync again.
export default function ProfileMenu({
  trigger,
  triggerClassName = '',
  panelClassName = '',
  direction = 'down',
  ariaLabel = 'Profile menu',
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeMenu() {
    setOpen(false);
    onNavigate?.();
  }

  async function handleLogout() {
    closeMenu();
    await logout();
    navigate('/login');
  }

  return (
    <div className="relative" ref={containerRef}>
      {open && (
        <div
          className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white rounded-lg shadow-modal border border-neutral-200 overflow-hidden z-30 ${panelClassName}`}
        >
          <NavLink
            to="/profile"
            onClick={closeMenu}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <ProfileIcon className="w-4 h-4" />
            Profile
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-danger-text hover:bg-danger-bg"
          >
            <LogOutIcon className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
    </div>
  );
}
