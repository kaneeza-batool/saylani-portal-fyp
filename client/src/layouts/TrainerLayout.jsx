import TrainerSidebar from '../components/TrainerSidebar';
import TopBar from '../components/TopBar';
import CommandPalette from '../components/CommandPalette';
import AnimatedOutlet from '../components/AnimatedOutlet';
import ToastStack from '../components/ToastStack';
import { CommandPaletteProvider } from '../context/CommandPaletteContext';

// CommandPaletteProvider wraps here for the same reason SubAdminLayout
// wraps it — TopBar calls useCommandPalette() unconditionally, so every
// /trainer/* route would crash on render without it.
export default function TrainerLayout() {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
        <TrainerSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />

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
