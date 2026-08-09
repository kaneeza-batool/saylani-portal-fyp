import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { title: '', company: '', location: '', type: 'Full-time', status: 'open' };

export default function JobFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
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
      title={mode === 'add' ? 'Add Job' : 'Edit Job'}
      onClose={onClose}
      formId="job-form"
      saveLabel={mode === 'add' ? 'Add Job' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="job-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="job-title">
            Job title
          </label>
          <input id="job-title" type="text" required value={form.title} onChange={setField('title')} placeholder="e.g. Junior Frontend Developer" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="job-company">
            Company
          </label>
          <input id="job-company" type="text" required value={form.company} onChange={setField('company')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="job-location">
              Location
            </label>
            <input id="job-location" type="text" value={form.location} onChange={setField('location')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="job-type">
              Type
            </label>
            <select id="job-type" value={form.type} onChange={setField('type')} className={`${inputClass} bg-surface`}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="job-status">
            Status
          </label>
          <select id="job-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </form>
    </SlideOverPanel>
  );
}
