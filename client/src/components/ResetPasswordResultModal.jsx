import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Shown once, right after a Reset Password action succeeds — the new
// password is never stored anywhere (see server/controllers/
// trainerPasswordController.js), so this modal is the only place it's ever
// visible. Closing it discards it for good, same as any "shown once"
// secret; the admin is expected to copy/share it before dismissing.
export default function ResetPasswordResultModal({ open, result, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  function handleCopy() {
    navigator.clipboard?.writeText(result.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-[360px] max-w-[90vw] bg-surface rounded-xl shadow-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <div className="font-heading font-bold text-h6 text-neutral-900">Password Reset</div>
              <div className="text-body-sm text-neutral-500 mt-1">
                Share this with the trainer now — it won't be shown again. They can change it from their own Profile page after logging in.
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-overline uppercase text-neutral-400">Login Email</span>
              <span className="text-body-sm font-semibold text-neutral-900">{result.email}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-overline uppercase text-neutral-400">New Password</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-body-sm font-semibold text-neutral-900 tracking-wide">
                  {result.password}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-2 rounded cursor-pointer transition-colors hover:bg-neutral-100 shrink-0"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="self-end border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[9px] rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
