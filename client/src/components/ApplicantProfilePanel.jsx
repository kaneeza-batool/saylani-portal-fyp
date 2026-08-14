const SERVER_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-overline uppercase text-neutral-500">{label}</span>
      <p className="text-body-sm text-neutral-900 whitespace-pre-line">{value}</p>
    </div>
  );
}

export default function ApplicantProfilePanel({ open, application, onClose, onStatusChange, statusUpdating }) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(13,25,53,0.35)] z-20 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />

      <div
        className="fixed top-0 right-0 h-screen w-[460px] bg-surface shadow-panel z-30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: open ? 'translateX(0%)' : 'translateX(100%)', pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="px-6 py-[22px] border-b border-neutral-200 flex items-center justify-between">
          <div className="font-heading font-bold text-h5 text-neutral-900">Applicant Profile</div>
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

        {application && (
          <div className="px-6 py-[22px] overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {application.photoUrl ? (
                <img
                  src={`${SERVER_ORIGIN}${application.photoUrl}`}
                  alt={application.fullName}
                  className="w-16 h-16 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h6 border border-gold-500/40">
                  {initials(application.fullName)}
                </div>
              )}
              <div>
                <div className="font-heading font-bold text-body text-neutral-900">{application.fullName}</div>
                <div className="text-caption text-neutral-400">Applied for {application.jobTitle}</div>
              </div>
            </div>

            {application.matchScore !== null && application.matchScore !== undefined && (
              <div className="flex flex-col gap-1.5">
                <span className="text-overline uppercase text-neutral-500">Job Match</span>
                <div className="h-2 rounded-pill bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full rounded-pill ${
                      application.matchScore >= 70 ? 'bg-success-text' : application.matchScore >= 40 ? 'bg-warning-text' : 'bg-neutral-300'
                    }`}
                    style={{ width: `${application.matchScore}%` }}
                  />
                </div>
                <span className="text-caption text-neutral-500">{application.matchScore}% keyword match with job requirements</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-overline uppercase text-neutral-500">Status</span>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={statusUpdating}
                    onClick={() => onStatusChange(s.value)}
                    className={`text-caption font-semibold px-3 py-[7px] rounded-pill cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      application.status === s.value
                        ? 'bg-gold-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Email" value={application.email} />
            <Field label="Phone" value={application.phone} />
            <Field label="Address" value={application.address} />
            <Field label="Education" value={application.education} />
            <Field label="Work Experience" value={application.experience} />
            <Field label="Skills" value={application.skills} />

            <div className="flex flex-col gap-1.5">
              <span className="text-overline uppercase text-neutral-500">Resume / CV</span>
              <a
                href={`${SERVER_ORIGIN}${application.resumeUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-600 hover:underline w-fit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12M7 10l5 5 5-5" />
                  <path d="M4 21h16" />
                </svg>
                Download resume
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
