import { AnimatePresence, motion } from 'framer-motion';

// Renders in normal document flow wherever the caller places it (StudentLayout
// puts it directly under TopBar, ProfilePage puts it at the top of its own
// content) — it pushes surrounding content down via the height animation
// rather than floating over it, so it can never overlap page content the way
// a fixed-position toast could (was previously `fixed bottom-6 right-6`,
// which collided with the Certificate QR code and Leaderboard's row list).
export default function Toast({ toast, onDismiss, className = '', testId = 'toast' }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            data-testid={testId}
            className={`flex items-start gap-3 bg-white border border-accent-200 rounded-lg shadow-glow px-4 py-3.5 ${className}`}
          >
            {toast.icon}
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-bold text-neutral-900">{toast.title}</p>}
              {toast.message && <p className="text-sm text-neutral-500 mt-0.5">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-neutral-400 hover:text-neutral-600 text-lg leading-none shrink-0"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
