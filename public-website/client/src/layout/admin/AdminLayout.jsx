import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

/* ============================================================
   TITAN — Admin Layout
   Internal tool shell (sidebar + topbar), deliberately distinct from the
   public marketing layout: no Navbar/Footer/QuizFAB. Still on-brand
   navy/gold, but reads as an operational dashboard, not a landing page.
   ============================================================ */

const AdminLayout = () => {
  const { admin, loading, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <p className="text-sm font-semibold text-neutral-400">Loading admin session...</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-neutral-100">
      <aside className="w-64 shrink-0 bg-primary-900 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-lg font-black tracking-tight leading-none">TITAN Admin</p>
          <p className="text-[10px] text-accent-400 mt-1.5 uppercase tracking-widest font-bold">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {[
            { to: '/admin/dashboard', label: 'Courses' },
            { to: '/admin/entry-test', label: 'Entry Test Applicants' },
            { to: '/admin/results', label: 'Academic Results' },
            { to: '/admin/id-cards', label: 'Student ID Cards' },
            { to: '/admin/contact-submissions', label: 'Contact Submissions' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-semibold no-underline transition-colors ${
                  isActive ? 'bg-accent-500 text-primary-900' : 'text-white/75 hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-bold text-accent-400 hover:text-accent-300 no-underline transition-colors"
          >
            View Live Site ↗
          </a>
        </div>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs font-semibold text-white/80 truncate">{admin.name}</p>
          <p className="text-[11px] text-white/40 truncate">{admin.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 text-xs font-bold text-white/60 hover:text-white transition-colors cursor-pointer bg-transparent border-none px-1.5 py-1 -ml-1.5"
          >
            Log Out →
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
