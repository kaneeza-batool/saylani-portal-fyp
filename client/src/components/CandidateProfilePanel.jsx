// Slide-over detail panel for a pending admission, same layout convention as
// ApplicantProfilePanel.jsx (job applicants) — a read-only field list plus an
// action row, this time Approve/Reject instead of a status picker. `student`
// here is the same object already present in AdmissionsQueuePage's list
// query (admissionController.getAdmissions returns full Student docs), so
// this panel needs no fetch of its own.

// The application-photo/CNIC-front/CNIC-back files themselves live on
// public-website's server (a different origin from this app's own API,
// since that's the app the application form is on), not this app's own
// /uploads — same cross-origin-asset reasoning as
// ApplicantProfilePanel.jsx's SERVER_ORIGIN, just pointed at a different app.
const PUBLIC_WEBSITE_ORIGIN = import.meta.env.VITE_PUBLIC_WEBSITE_ORIGIN || 'http://localhost:5200';

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

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function formatCnic(bareCnic) {
  const digits = String(bareCnic || '').replace(/\D/g, '');
  if (digits.length !== 13) return bareCnic || '—';
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
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

// url is a relative path (e.g. "/uploads/applications/photo-...png") as
// stored on the Student doc — resolved against PUBLIC_WEBSITE_ORIGIN since
// that's the server the file actually lives on, not this app's own API.
function DocumentLink({ label, url }) {
  if (!url) return null;
  return (
    <a
      href={`${PUBLIC_WEBSITE_ORIGIN}${url}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-600 hover:underline w-fit"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12M7 10l5 5 5-5" />
        <path d="M4 21h16" />
      </svg>
      View {label}
    </a>
  );
}

export default function CandidateProfilePanel({ open, applicant, onClose, onApprove, onReject, actionPending }) {
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
          <div className="font-heading font-bold text-h5 text-neutral-900">Candidate Profile</div>
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

        {applicant && (
          <div className="px-6 py-[22px] overflow-y-auto flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {applicant.avatarUrl ? (
                <img
                  src={applicant.avatarUrl}
                  alt={applicant.name}
                  className="w-16 h-16 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h6 border border-gold-500/40">
                  {initials(applicant.name)}
                </div>
              )}
              <div>
                <div className="font-heading font-bold text-body text-neutral-900">{applicant.name}</div>
                <div className="text-caption text-neutral-400">Applied for {applicant.course}</div>
              </div>
            </div>

            <Field label="Applied On" value={fmtDate(applicant.createdAt)} />
            <Field label="Father's Name" value={applicant.father} />
            <Field label="CNIC" value={formatCnic(applicant.cnic)} />
            <Field label="Email" value={applicant.email} />
            <Field label="Phone" value={applicant.phone} />
            <Field label="Address" value={applicant.address} />
            <Field label="Campus" value={applicant.campus ? `${applicant.campus.name}${applicant.campus.city ? `, ${applicant.campus.city}` : ''}` : null} />
            <Field label="Gender" value={applicant.gender} />
            <Field label="Date of Birth" value={applicant.dateOfBirth ? fmtDate(applicant.dateOfBirth) : null} />
            <Field label="Last Qualification" value={applicant.lastQualification} />
            <Field
              label="Employment Status"
              value={applicant.employmentStatus === 'employed' ? 'Employed' : applicant.employmentStatus === 'unemployed' ? 'Unemployed' : null}
            />
            {applicant.employmentStatus === 'employed' && (
              <>
                <Field label="Company" value={applicant.companyName} />
                <Field label="Job Title" value={applicant.jobTitle} />
              </>
            )}
            <Field
              label="Computer Proficiency"
              value={applicant.computerProficiency ? applicant.computerProficiency[0].toUpperCase() + applicant.computerProficiency.slice(1) : null}
            />
            <Field label="Has Laptop" value={applicant.hasLaptop === true ? 'Yes' : applicant.hasLaptop === false ? 'No' : null} />

            {(applicant.applicationPhotoUrl || applicant.applicationCnicFrontUrl || applicant.applicationCnicBackUrl) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-overline uppercase text-neutral-500">Submitted Documents</span>
                <div className="flex flex-col gap-2">
                  <DocumentLink label="Photo" url={applicant.applicationPhotoUrl} />
                  <DocumentLink label="CNIC — Front" url={applicant.applicationCnicFrontUrl} />
                  <DocumentLink label="CNIC — Back" url={applicant.applicationCnicBackUrl} />
                </div>
              </div>
            )}

            {(onApprove || onReject) && (
              <div className="flex gap-2 pt-2 mt-auto border-t border-neutral-200">
                {onApprove && (
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={onApprove}
                    className="flex-1 border-none bg-gold-500 text-white text-body-sm font-semibold px-3 py-2.5 rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                )}
                {onReject && (
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={onReject}
                    className="flex-1 border border-danger-200 bg-surface text-danger-600 text-body-sm font-semibold px-3 py-2.5 rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
