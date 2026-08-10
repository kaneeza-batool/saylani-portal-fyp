import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { name: '', email: '', phone: '', employeeId: '', course: '', city: '', status: 'active' };

export default function TrainerFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [open, initialValues]);

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

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="trainer-status">
            Status
          </label>
          <select id="trainer-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </SlideOverPanel>
  );
}
