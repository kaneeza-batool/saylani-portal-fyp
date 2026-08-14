import { AnimatePresence, motion } from 'framer-motion';
import { CloseIcon } from './icons';

export default function Modal({ open, onClose, title, footer, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-xl sm:rounded-lg shadow-modal flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-200 shrink-0">
              <h3 className="font-heading text-lg font-bold text-neutral-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-100"
                aria-label="Close"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-neutral-200 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
