import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { name: '', city: '', address: '', phone: '', status: 'active' };

export default function CampusFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
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
      title={mode === 'add' ? 'Add Campus' : 'Edit Campus'}
      onClose={onClose}
      formId="campus-form"
      saveLabel={mode === 'add' ? 'Add Campus' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="campus-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campus-name">
            Campus name
          </label>
          <input id="campus-name" type="text" required value={form.name} onChange={setField('name')} placeholder="e.g. Karachi Gulshan Campus" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campus-city">
            City
          </label>
          <input id="campus-city" type="text" required value={form.city} onChange={setField('city')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campus-address">
            Address
          </label>
          <input id="campus-address" type="text" value={form.address} onChange={setField('address')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campus-phone">
            Phone
          </label>
          <input id="campus-phone" type="text" value={form.phone} onChange={setField('phone')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campus-status">
            Status
          </label>
          <select id="campus-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-white`}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </SlideOverPanel>
  );
}
