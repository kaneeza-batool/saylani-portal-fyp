import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Toast({ toast, onDismiss }) {
  // Portaled to document.body — Sidebar (the main caller) sits inside an
  // <aside> with `transform` applied for its slide-in/out animation, which
  // makes it a containing block for `position: fixed` descendants. Left as
  // a normal child, this rendered pinned to the sidebar's own box (visibly
  // bottom-left of the sidebar) instead of the viewport's bottom-right.
  return createPortal(
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            data-testid="streak-milestone-toast"
            className="flex items-start gap-3 bg-white border border-accent-200 rounded-lg shadow-glow px-4 py-3.5 max-w-sm"
          >
            {toast.icon && <span className="text-2xl leading-none">{toast.icon}</span>}
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-bold text-neutral-900">{toast.title}</p>}
              {toast.message && <p className="text-sm text-neutral-500 mt-0.5">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-neutral-400 hover:text-neutral-600 text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
