import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

// Placeholder shell — same structure/theme as SuperAdminLayout, reusing the
// same Sidebar/TopBar rather than a sub-admin-specific nav. Real Sub-Admin
// pages (and likely a trimmed-down sidebar) land in a later phase; this only
// needs to exist so sub_admin has a destination and login doesn't loop.
export default function SubAdminLayout() {
  return (
    <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <div className="flex-1 pt-[26px] px-[28px] pb-[60px] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
