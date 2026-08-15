// Shared chrome for every add/edit slide-over in the admin (Students,
// Campuses, Trainers, Courses, Employers, Sub-Admins) — overlay, panel,
// header, footer. Each caller renders its own <form id={formId}> as
// children; the footer's Save button targets that form via the HTML
// `form` attribute so it can live outside the form's DOM subtree.
export default function SlideOverPanel({ open, title, onClose, formId, saveLabel, submitting, error, children }) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(13,25,53,0.35)] z-20 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />

      <div
        className="fixed top-0 right-0 h-screen w-full max-w-[460px] bg-surface shadow-panel z-30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: open ? 'translateX(0%)' : 'translateX(100%)', pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="px-6 py-[22px] border-b border-neutral-200 flex items-center justify-between">
          <div className="font-heading font-bold text-h5 text-neutral-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="w-[30px] h-[30px] border-none bg-neutral-100 rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-[22px] overflow-y-auto flex-1 flex flex-col gap-3.5">
          {children}
          {error && (
            <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>
          )}
        </div>

        <div className="px-6 py-[18px] border-t border-neutral-200 flex gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border border-neutral-200 bg-surface text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="border-none bg-gold-500 text-white text-body-sm font-semibold px-4.5 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}
