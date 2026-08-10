import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { companyName: '', contactEmail: '', contactPhone: '', city: '', status: 'pending' };

export default function EmployerFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
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
      title={mode === 'add' ? 'Add Employer' : 'Edit Employer'}
      onClose={onClose}
      formId="employer-form"
      saveLabel={mode === 'add' ? 'Add Employer' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="employer-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="employer-name">
            Company name
          </label>
          <input id="employer-name" type="text" required value={form.companyName} onChange={setField('companyName')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="employer-email">
            Contact email
          </label>
          <input id="employer-email" type="email" required value={form.contactEmail} onChange={setField('contactEmail')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="employer-phone">
              Contact phone
            </label>
            <input id="employer-phone" type="text" value={form.contactPhone} onChange={setField('contactPhone')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="employer-city">
              City
            </label>
            <input id="employer-city" type="text" value={form.city} onChange={setField('city')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="employer-status">
            Verification status
          </label>
          <select id="employer-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </form>
    </SlideOverPanel>
  );
}
