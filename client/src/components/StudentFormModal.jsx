import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchCampuses } from '../services/campusService';

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

const EMPTY_FORM = {
  name: '',
  father: '',
  cnic: '',
  phone: '',
  email: '',
  course: COURSES[0],
  campus: '',
  status: 'enrolled',
  address: '',
};

const inputClass =
  'border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-royal-500 transition-colors';
const labelClass = 'text-caption font-semibold text-neutral-600';

export default function StudentFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const { user } = useAuth();
  const isCampusLocked = user?.role === 'sub_admin';

  const [form, setForm] = useState(EMPTY_FORM);
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetchCampuses({ status: 'active', limit: 100 })
      .then((data) => setCampuses(data.items ?? []))
      .catch(() => setCampuses([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const lockedCampus = isCampusLocked ? user?.campus_id ?? '' : undefined;
    // initialValues.campus comes populated ({_id, name, city}) from the students
    // list/detail endpoints — normalize to the plain id the <select> and submit
    // payload expect. Falls back to a bare string in case a caller ever passes one.
    const editCampus = initialValues?.campus?._id ?? initialValues?.campus ?? '';
    setForm(
      initialValues
        ? { ...EMPTY_FORM, ...initialValues, campus: lockedCampus ?? editCampus }
        : { ...EMPTY_FORM, campus: lockedCampus ?? campuses[0]?._id ?? '' }
    );
  }, [open, initialValues, isCampusLocked, user, campuses]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const title = mode === 'add' ? 'Add Student' : 'Edit Student';
  const saveLabel = mode === 'add' ? 'Add Student' : 'Save Changes';

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(11,42,32,0.35)] z-20 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />

      <div
        className="fixed top-0 right-0 h-screen w-[460px] bg-white shadow-panel z-30 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
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
            <select id="student-course" value={form.course} onChange={setField('course')} className={`${inputClass} bg-white`}>
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
                className={`${inputClass} bg-white ${isCampusLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
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
              <select id="student-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-white`}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="student-address">
              Address
            </label>
            <input id="student-address" type="text" value={form.address} onChange={setField('address')} className={inputClass} />
          </div>

          {error && (
            <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>
          )}
        </form>

        <div className="px-6 py-[18px] border-t border-neutral-200 flex gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border border-neutral-200 bg-white text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={submitting}
            className="border-none bg-royal-500 text-white text-body-sm font-semibold px-4.5 py-[10px] rounded cursor-pointer transition-colors hover:bg-royal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}
