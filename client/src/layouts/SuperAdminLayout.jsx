import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CommandPalette from '../components/CommandPalette';
import { CommandPaletteProvider } from '../context/CommandPaletteContext';

export default function SuperAdminLayout() {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />

          <div className="flex-1 pt-[26px] px-[28px] pb-[60px] overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>

      <CommandPalette />
    </CommandPaletteProvider>
  );
}
