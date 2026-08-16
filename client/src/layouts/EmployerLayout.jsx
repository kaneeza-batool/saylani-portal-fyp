import EmployerSidebar from '../components/EmployerSidebar';
import TopBar from '../components/TopBar';
import CommandPalette from '../components/CommandPalette';
import AnimatedOutlet from '../components/AnimatedOutlet';
import ToastStack from '../components/ToastStack';
import { CommandPaletteProvider } from '../context/CommandPaletteContext';

// Same shell as TrainerLayout.jsx — TopBar calls useCommandPalette()
// unconditionally, so CommandPaletteProvider has to wrap every layout that
// renders it, employer included.
export default function EmployerLayout() {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
        <EmployerSidebar />

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
