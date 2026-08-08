import { Outlet } from 'react-router-dom';
import SubAdminSidebar from '../portals/sub-admin/components/SubAdminSidebar';
import SubAdminTopBar from '../portals/sub-admin/components/SubAdminTopBar';

export default function SubAdminLayout() {
  return (
    <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
      <SubAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SubAdminTopBar />

        <div className="flex-1 pt-[26px] px-[28px] pb-[60px] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
