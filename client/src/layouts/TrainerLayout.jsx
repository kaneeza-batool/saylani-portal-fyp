import { Outlet } from 'react-router-dom';
import TrainerSidebar from '../components/TrainerSidebar';
import TopBar from '../components/TopBar';

export default function TrainerLayout() {
  return (
    <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
      <TrainerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <div className="flex-1 pt-[26px] px-[28px] pb-[60px] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}