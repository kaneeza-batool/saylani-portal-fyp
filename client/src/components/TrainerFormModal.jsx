import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';
import { useAuth } from '../context/AuthContext';
import { fetchCampuses } from '../services/campusService';

// Same 7 courses as StudentFormModal's own COURSES constant (Student.COURSES
// on the server) — kept as a local copy rather than a shared import, matching
// how StudentFormModal already does it in this codebase.
const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

const EMPTY_FORM = { name: '', email: '', phone: '', employeeId: '', course: '', city: '', campus: '', status: 'active' };

export default function TrainerFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
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
    // user.campus_id now comes populated ({_id, name}) from authController's
    // toSafeUser — normalize to the plain id, same as editCampus below.
    const lockedCampus = isCampusLocked ? user?.campus_id?._id ?? user?.campus_id ?? '' : undefined;
    // initialValues.campus comes populated ({_id, name, city}) from the
    // trainers list endpoint — normalize to the plain id the <select> and
    // submit payload expect, same as StudentFormModal.
    const editCampus = initialValues?.campus?._id ?? initialValues?.campus ?? '';
    const resolvedCampus = initialValues ? lockedCampus ?? editCampus : lockedCampus ?? campuses[0]?._id ?? '';
    // City always follows the resolved campus — same reasoning as the
    // server-side hook (Trainer.js's autoFieldsFromCampus): a free-typed
    // city that could disagree with the chosen campus was the actual bug.
    // Falls back to whatever the trainers list already populated
    // (initialValues.campus.city) if the campuses list hasn't loaded yet.
    const campusDoc = campuses.find((c) => c._id === resolvedCampus);
    const resolvedCity = campusDoc?.city ?? initialValues?.campus?.city ?? initialValues?.city ?? '';
    setForm(
      initialValues
        ? { ...EMPTY_FORM, ...initialValues, campus: resolvedCampus, city: resolvedCity }
        : { ...EMPTY_FORM, campus: resolvedCampus, city: resolvedCity }
    );
  }, [open, initialValues, isCampusLocked, user, campuses]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Campus drives City directly (see effect above for why) — this is the
  // live version of the same derivation for whenever the admin actually
  // changes the selection after the form is already open.
  const setCampus = (e) => {
    const campusId = e.target.value;
    const campusDoc = campuses.find((c) => c._id === campusId);
    setForm((f) => ({ ...f, campus: campusId, city: campusDoc?.city ?? f.city }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Trainer' : 'Edit Trainer'}
      onClose={onClose}
      formId="trainer-form"
      saveLabel={mode === 'add' ? 'Add Trainer' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="trainer-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="trainer-name">
            Full name
          </label>
          <input id="trainer-name" type="text" required value={form.name} onChange={setField('name')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-email">
              Email
            </label>
            <input id="trainer-email" type="email" required value={form.email} onChange={setField('email')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-phone">
              Phone
            </label>
            <input id="trainer-phone" type="text" value={form.phone} onChange={setField('phone')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="trainer-employeeId">
            Employee ID
          </label>
          {mode === 'add' ? (
            <input
              id="trainer-employeeId"
              type="text"
              disabled
              placeholder="Generated automatically after saving (e.g. TRN-SUK-014)"
              className={`${inputClass} opacity-70 cursor-not-allowed placeholder:text-neutral-400`}
            />
          ) : (
            <input
              id="trainer-employeeId"
              type="text"
              required
              value={form.employeeId}
              onChange={setField('employeeId')}
              className={inputClass}
            />
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-course">
              Course
            </label>
            <select id="trainer-course" value={form.course} onChange={setField('course')} className={`${inputClass} bg-surface`}>
              <option value="">Select course</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-city">
              City
            </label>
            <input
              id="trainer-city"
              type="text"
              disabled
              value={form.city}
              placeholder="Auto-filled from campus"
              className={`${inputClass} opacity-70 cursor-not-allowed`}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-campus">
              Campus
            </label>
            <select
              id="trainer-campus"
              required
              value={form.campus}
              onChange={setCampus}
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
            <label className={labelClass} htmlFor="trainer-status">
              Status
            </label>
            <select id="trainer-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </SlideOverPanel>
  );
}
