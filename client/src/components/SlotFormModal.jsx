import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';
import { fetchCampuses } from '../services/campusService';

const EMPTY_FORM = {
  schedule: '',
  trainer: '',
  course: '',
  campus: '',
  seatsTotal: 30,
  gender: 'Mixed',
  status: 'active',
};

export default function SlotFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
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
    // initialValues.campus comes populated ({_id, name, city}) from the
    // slots list endpoint — normalize to the plain id the <select> and
    // submit payload expect, same as StudentFormModal/TrainerFormModal.
    const editCampus = initialValues?.campus?._id ?? initialValues?.campus ?? '';
    setForm(
      initialValues
        ? { ...EMPTY_FORM, ...initialValues, campus: editCampus }
        : { ...EMPTY_FORM, campus: campuses[0]?._id ?? '' }
    );
  }, [open, initialValues, campuses]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, seatsTotal: Number(form.seatsTotal) || 1 });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Slot' : 'Edit Slot'}
      onClose={onClose}
      formId="slot-form"
      saveLabel={mode === 'add' ? 'Add Slot' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="slot-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="slot-schedule">
            Schedule
          </label>
          <input
            id="slot-schedule"
            type="text"
            required
            value={form.schedule}
            onChange={setField('schedule')}
            placeholder="Sat 09:00 AM - 11:00 AM | Wed 09:00 AM - 11:00 AM"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="slot-trainer">
              Trainer
            </label>
            <input id="slot-trainer" type="text" required value={form.trainer} onChange={setField('trainer')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="slot-course">
              Course
            </label>
            <input id="slot-course" type="text" required value={form.course} onChange={setField('course')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="slot-campus">
            Campus
          </label>
          <select
            id="slot-campus"
            required
            value={form.campus}
            onChange={setField('campus')}
            className={`${inputClass} bg-surface`}
          >
            <option value="" disabled>
              Select a campus
            </option>
            {campuses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="slot-seatsTotal">
            Total seats
          </label>
          <input id="slot-seatsTotal" type="number" min="1" required value={form.seatsTotal} onChange={setField('seatsTotal')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="slot-gender">
              Gender
            </label>
            <select id="slot-gender" value={form.gender} onChange={setField('gender')} className={`${inputClass} bg-surface`}>
              <option value="Mixed">Mixed</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="slot-status">
              Status
            </label>
            <select id="slot-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </SlideOverPanel>
  );
}
