import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchCampuses } from '../services/campusService';
import { fetchSlots } from '../services/slotService';

const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

const STATUS_OPTIONS = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropout', label: 'Dropout' },
  { value: 'rejected', label: 'Rejected' },
];

const PAYMENT_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
];

const COMPUTER_PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const LAPTOP_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const EMPTY_FORM = {
  name: '',
  father: '',
  cnic: '',
  phone: '',
  email: '',
  course: COURSES[0],
  campus: '',
  batch: '',
  status: 'enrolled',
  payment: 'pending',
  address: '',
  employmentStatus: '',
  salary: '',
  companyName: '',
  jobTitle: '',
  employmentStartDate: '',
  computerProficiency: '',
  hasLaptop: '',
};

// hasLaptop is a Boolean on the server (true/false/null) but a controlled
// <select> needs string values — 'yes'/'no'/'' round-trips through both a
// real boolean and the unset (null/undefined) case existing students have.
function laptopToForm(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
}
function laptopToPayload(value) {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

// Dates come back from the API as full ISO timestamps; <input type="date">
// needs the bare yyyy-mm-dd slice or it renders blank.
function dateToForm(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

const inputClass =
  'border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors';
const labelClass = 'text-caption font-semibold text-neutral-600';

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

function SummaryField({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      <span className="text-body-sm text-neutral-900">{value || '—'}</span>
    </div>
  );
}

const EMPLOYMENT_STATUS_LABEL = Object.fromEntries(EMPLOYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const COMPUTER_PROFICIENCY_LABEL = Object.fromEntries(COMPUTER_PROFICIENCY_OPTIONS.map((o) => [o.value, o.label]));

// lastQualification is self-reported via the student portal (onboarding/
// profile edit) — read-only here, not part of the editable form fields
// below, since an admin overwriting a student's own reported qualification
// isn't a real workflow. gender/dateOfBirth stay omitted: unset for every
// real student in titan-portal as of this pass, so there's nothing honest
// to display for them yet. The employment/computer fields below, by
// contrast, ARE admin-editable further down this form — shown here too as
// an at-a-glance snapshot of the record's current state.
function StudentProfileSummary({ student }) {
  return (
    <div className="flex flex-col gap-3 pb-1">
      <div className="flex items-center gap-3.5">
        {student.avatarUrl ? (
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-16 h-16 rounded-full object-cover shrink-0 border border-gold-500/40"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h5 shrink-0 border border-gold-500/40">
            {initials(student.name)}
          </div>
        )}
        <SummaryField label="Last Qualification" value={student.lastQualification} />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <SummaryField label="Employment" value={EMPLOYMENT_STATUS_LABEL[student.employmentStatus]} />
        <SummaryField label="Company" value={student.companyName} />
        <SummaryField label="Job Title" value={student.jobTitle} />
        <SummaryField label="Computer Proficiency" value={COMPUTER_PROFICIENCY_LABEL[student.computerProficiency]} />
        <SummaryField label="Laptop" value={student.hasLaptop === true ? 'Yes' : student.hasLaptop === false ? 'No' : ''} />
      </div>
    </div>
  );
}

export default function StudentFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const { user } = useAuth();
  const isCampusLocked = user?.role === 'sub_admin';
  // Pending/rejected are admissions-applicant states, only reachable through
  // the Admissions Queue's approve/reject flow — offering them here let a
  // sub_admin quietly bounce a roster student back to pending and watch them
  // vanish from the roster (which excludes both statuses). Enforced
  // server-side too (studentController.updateStudent), this just keeps the
  // dropdown from offering a value the API will now reject.
  const statusOptions = user?.role === 'sub_admin' ? STATUS_OPTIONS.filter((s) => !['pending', 'rejected'].includes(s.value)) : STATUS_OPTIONS;

  const [form, setForm] = useState(EMPTY_FORM);
  const [campuses, setCampuses] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetchCampuses({ status: 'active', limit: 100 })
      .then((data) => setCampuses(data.items ?? []))
      .catch(() => setCampuses([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // user.campus_id now comes populated ({_id, name}) from authController's
    // toSafeUser — normalize to the plain id, same as editCampus below.
    const lockedCampus = isCampusLocked ? user?.campus_id?._id ?? user?.campus_id ?? '' : undefined;
    // initialValues.campus/.batch come populated ({_id, ...}) from the students
    // list/detail endpoints — normalize to the plain id the <select>s and submit
    // payload expect. Falls back to a bare string in case a caller ever passes one.
    const editCampus = initialValues?.campus?._id ?? initialValues?.campus ?? '';
    const editBatch = initialValues?.batch?._id ?? initialValues?.batch ?? '';
    setForm(
      initialValues
        ? {
            ...EMPTY_FORM,
            ...initialValues,
            campus: lockedCampus ?? editCampus,
            batch: editBatch,
            // Nullable enums/dates come back from the API as `null` for the
            // 66 pre-existing students that predate these fields — a
            // controlled <select>/<input> needs '' instead, or React warns
            // about switching an input from uncontrolled to controlled.
            employmentStatus: initialValues.employmentStatus ?? '',
            salary: initialValues.salary ?? '',
            companyName: initialValues.companyName ?? '',
            jobTitle: initialValues.jobTitle ?? '',
            employmentStartDate: dateToForm(initialValues.employmentStartDate),
            computerProficiency: initialValues.computerProficiency ?? '',
            hasLaptop: laptopToForm(initialValues.hasLaptop),
          }
        : { ...EMPTY_FORM, campus: lockedCampus ?? campuses[0]?._id ?? '' }
    );
  }, [open, initialValues, isCampusLocked, user, campuses]);

  // Batch options are scoped to whichever campus is currently selected — for
  // sub_admin that's always their own (server re-validates regardless, see
  // studentController.resolveBatchAssignment); for super_admin it tracks the
  // Campus <select> above. Re-fetches on campus change; only active batches
  // are offered since assigning new students into an inactive one is not a
  // real workflow. A student's currently-assigned batch is preserved in
  // `form.batch` even if a campus switch makes it disappear from this list —
  // submitting unchanged just re-sends the same id.
  useEffect(() => {
    if (!open || !form.campus) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    fetchSlots({ status: 'active', limit: 100 })
      .then((data) => {
        if (cancelled) return;
        setBatches((data.items ?? []).filter((b) => (b.campus?._id ?? b.campus) === form.campus));
      })
      .catch(() => !cancelled && setBatches([]));
    return () => {
      cancelled = true;
    };
  }, [open, form.campus]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      employmentStatus: form.employmentStatus || null,
      salary: form.salary === '' ? null : Number(form.salary),
      employmentStartDate: form.employmentStartDate || null,
      computerProficiency: form.computerProficiency || null,
      hasLaptop: laptopToPayload(form.hasLaptop),
    });
  };

  const title = mode === 'add' ? 'Add Student' : 'Edit Student';
  const saveLabel = mode === 'add' ? 'Add Student' : 'Save Changes';

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

        <form id="student-form" onSubmit={handleSubmit} className="px-6 py-[22px] overflow-y-auto flex-1 flex flex-col gap-3.5">
          {mode === 'edit' && initialValues && <StudentProfileSummary student={initialValues} />}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-name">
              Full name
            </label>
            <input
              id="student-name"
              type="text"
              required
              value={form.name}
              onChange={setField('name')}
              placeholder="e.g. Hamza Tariq"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-father">
                Father's name
              </label>
              <input id="student-father" type="text" required value={form.father} onChange={setField('father')} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-cnic">
                CNIC
              </label>
              <input
                id="student-cnic"
                type="text"
                required
                value={form.cnic}
                onChange={setField('cnic')}
                placeholder="42101-1234567-1"
                pattern="\d{5}-\d{7}-\d"
                title="Format: 12345-1234567-1"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-phone">
                Phone
              </label>
              <input id="student-phone" type="text" required value={form.phone} onChange={setField('phone')} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-email">
                Email
              </label>
              <input
                id="student-email"
                type="email"
                required
                value={form.email}
                onChange={setField('email')}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-course">
              Course
            </label>
            <select id="student-course" value={form.course} onChange={setField('course')} className={`${inputClass} bg-surface`}>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-campus">
                Campus
              </label>
              <select
                id="student-campus"
                required
                value={form.campus}
                onChange={setField('campus')}
                disabled={isCampusLocked}
                className={`${inputClass} bg-surface ${isCampusLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {campuses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-status">
                Status
              </label>
              <select id="student-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-payment">
              Payment
            </label>
            <select id="student-payment" value={form.payment} onChange={setField('payment')} className={`${inputClass} bg-surface`}>
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {form.payment === 'overdue' && form.status === 'enrolled' && (
              <p className="text-badge text-warning-text">Marking this Overdue will drop the student automatically.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-batch">
              Batch
            </label>
            <select id="student-batch" value={form.batch} onChange={setField('batch')} className={`${inputClass} bg-surface`}>
              <option value="">No batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.schedule}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-address">
              Address
            </label>
            <input id="student-address" type="text" value={form.address} onChange={setField('address')} className={inputClass} />
          </div>

          <span className="text-overline uppercase text-neutral-400 font-semibold tracking-wide pt-1 border-t border-neutral-100">
            Employment Info
          </span>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-employment-status">
              Employment status
            </label>
            <select
              id="student-employment-status"
              value={form.employmentStatus}
              onChange={setField('employmentStatus')}
              className={`${inputClass} bg-surface`}
            >
              <option value="">Not set</option>
              {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-company">
                Company name
              </label>
              <input
                id="student-company"
                type="text"
                value={form.companyName}
                onChange={setField('companyName')}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-job-title">
                Job title
              </label>
              <input id="student-job-title" type="text" value={form.jobTitle} onChange={setField('jobTitle')} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-salary">
                Salary
              </label>
              <input
                id="student-salary"
                type="number"
                min="0"
                value={form.salary}
                onChange={setField('salary')}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-employment-start">
                Employment start date
              </label>
              <input
                id="student-employment-start"
                type="date"
                value={form.employmentStartDate}
                onChange={setField('employmentStartDate')}
                className={inputClass}
              />
            </div>
          </div>

          <span className="text-overline uppercase text-neutral-400 font-semibold tracking-wide pt-1 border-t border-neutral-100">
            Other
          </span>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-computer-proficiency">
                Computer proficiency
              </label>
              <select
                id="student-computer-proficiency"
                value={form.computerProficiency}
                onChange={setField('computerProficiency')}
                className={`${inputClass} bg-surface`}
              >
                <option value="">Not set</option>
                {COMPUTER_PROFICIENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className={labelClass} htmlFor="student-laptop">
                Laptop
              </label>
              <select id="student-laptop" value={form.hasLaptop} onChange={setField('hasLaptop')} className={`${inputClass} bg-surface`}>
                <option value="">Not set</option>
                {LAPTOP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>
          )}
        </form>

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
            form="student-form"
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
