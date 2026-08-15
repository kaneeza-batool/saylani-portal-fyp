import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CommandPalette from '../components/CommandPalette';
import AnimatedOutlet from '../components/AnimatedOutlet';
import ToastStack from '../components/ToastStack';
import { CommandPaletteProvider } from '../context/CommandPaletteContext';

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />

          <div className="flex-1 pt-[26px] px-4 sm:px-[28px] pb-[60px] overflow-y-auto">
            <AnimatedOutlet />
          </div>
        </div>
      </div>

      <CommandPalette />
      <ToastStack />
    </CommandPaletteProvider>
  );
}
