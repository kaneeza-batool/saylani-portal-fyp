import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Toast from '../components/Toast';
import { pageTransition } from '../lib/motionVariants';

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const { pathname } = useLocation();
  // Key on the base segment only (e.g. "dashboard"), not the full path —
  // switching the active :courseId within the same page type should stay
  // a smooth in-place update (existing per-page useEffect/cache behavior),
  // not a full exit/enter transition every time the course switcher is used.
  const transitionKey = pathname.split('/')[1] || 'root';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Owns the milestone-toast's lifetime so it can render in normal document
  // flow directly under TopBar (see Toast.jsx) — Sidebar just reports the
  // milestone up via onMilestone rather than rendering its own floating
  // toast, which is what let it collide with page content before.
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  function handleMilestone(t) {
    setToast(t);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className="flex min-h-screen w-full font-sans text-neutral-900 bg-neutral-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onMilestone={handleMilestone} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <Toast
          toast={toast}
          onDismiss={() => setToast(null)}
          testId="streak-milestone-toast"
          className="mx-4 sm:mx-6 lg:mx-8 mt-3 sm:mt-4 max-w-sm sm:ml-auto"
        />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={transitionKey}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
