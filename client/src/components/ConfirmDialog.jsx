import { AnimatePresence, motion } from 'framer-motion';

// Centered confirm modal — replaces window.confirm() across every delete
// action in the app so it actually matches the design system instead of
// looking like a bare browser dialog.
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={loading ? undefined : onCancel}
            className="fixed inset-0 bg-[rgba(13,25,53,0.5)] z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alertdialog"
            aria-modal="true"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[380px] bg-surface rounded-xl shadow-[0_24px_60px_rgba(13,25,53,0.35)] p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <div className="font-heading font-bold text-h6 text-neutral-900">{title}</div>
            </div>

            <div className="text-body-sm text-neutral-600">{message}</div>

            <div className="flex gap-2.5 justify-end mt-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="border border-neutral-200 bg-surface text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="border-none bg-danger-600 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
