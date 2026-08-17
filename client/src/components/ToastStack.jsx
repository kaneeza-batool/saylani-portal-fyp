import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocketData } from '../context/SocketContext';

const TONE = {
  critical: { bg: 'bg-surface', border: 'border-danger-200', dot: 'bg-danger-600', label: 'text-danger-600' },
  warning: { bg: 'bg-surface', border: 'border-warning-text/30', dot: 'bg-warning-text', label: 'text-warning-text' },
};

export default function ToastStack() {
  const { toasts, dismissToast } = useSocketData();
  const navigate = useNavigate();

  return (
    <div className="fixed top-[80px] right-[26px] z-[70] flex flex-col gap-2.5 w-[320px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const tone = TONE[t.severity] ?? TONE.warning;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto ${tone.bg} border ${tone.border} rounded-xl shadow-panel p-3.5 flex items-start gap-2.5 relative overflow-hidden cursor-pointer`}
              onClick={() => {
                dismissToast(t.id);
                navigate('/admin/alerts');
              }}
            >
              <span className="relative w-2 h-2 mt-1.5 shrink-0">
                <span className={`absolute inset-0 rounded-full ${tone.dot}`} />
                <motion.span
                  className={`absolute inset-0 rounded-full ${tone.dot}`}
                  animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-caption font-semibold uppercase tracking-wide ${tone.label}`}>New Alert</div>
                <div className="text-body-sm text-neutral-700 mt-0.5">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(t.id);
                }}
                className="w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-neutral-600 transition-colors shrink-0 border-none bg-transparent cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <motion.div
                className={`absolute bottom-0 left-0 h-[2.5px] ${tone.dot}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
