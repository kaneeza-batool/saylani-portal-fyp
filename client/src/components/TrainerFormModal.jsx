import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';
import { useAuth } from '../context/AuthContext';
import { fetchCampuses } from '../services/campusService';

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
    const lockedCampus = isCampusLocked ? user?.campus_id ?? '' : undefined;
    // initialValues.campus comes populated ({_id, name, city}) from the
    // trainers list endpoint — normalize to the plain id the <select> and
    // submit payload expect, same as StudentFormModal.
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
          <input id="trainer-employeeId" type="text" required value={form.employeeId} onChange={setField('employeeId')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-course">
              Course
            </label>
            <input id="trainer-course" type="text" value={form.course} onChange={setField('course')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="trainer-city">
              City
            </label>
            <input id="trainer-city" type="text" value={form.city} onChange={setField('city')} className={inputClass} />
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
