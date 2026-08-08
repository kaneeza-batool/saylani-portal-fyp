import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';
import { fetchCampuses } from '../services/campusService';

const EMPTY_FORM = { name: '', email: '', password: '', campus_id: '', status: 'active' };

export default function SubAdminFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: campusData } = useQuery({
    queryKey: ['campuses', 'for-select'],
    queryFn: () => fetchCampuses({ limit: 100 }),
    enabled: open,
  });
  const campuses = campusData?.items ?? [];

  useEffect(() => {
    if (open) {
      setForm(
        initialValues
          ? { ...EMPTY_FORM, ...initialValues, campus_id: initialValues.campus_id?._id ?? initialValues.campus_id ?? '', password: '' }
          : EMPTY_FORM
      );
    }
  }, [open, initialValues]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (mode === 'edit' && !payload.password) delete payload.password;
    if (!payload.campus_id) delete payload.campus_id;
    onSubmit(payload);
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Sub-Admin' : 'Edit Sub-Admin'}
      onClose={onClose}
      formId="subadmin-form"
      saveLabel={mode === 'add' ? 'Add Sub-Admin' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="subadmin-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="subadmin-name">
            Full name
          </label>
          <input id="subadmin-name" type="text" required value={form.name} onChange={setField('name')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="subadmin-email">
            Email
          </label>
          <input id="subadmin-email" type="email" required value={form.email} onChange={setField('email')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="subadmin-password">
            Password {mode === 'edit' && <span className="font-normal text-neutral-400">(leave blank to keep current)</span>}
          </label>
          <input
            id="subadmin-password"
            type="password"
            required={mode === 'add'}
            minLength={8}
            value={form.password}
            onChange={setField('password')}
            placeholder={mode === 'edit' ? '••••••••' : undefined}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="subadmin-campus">
              Campus
            </label>
            <select id="subadmin-campus" value={form.campus_id} onChange={setField('campus_id')} className={`${inputClass} bg-white`}>
              <option value="">Unassigned</option>
              {campuses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="subadmin-status">
              Status
            </label>
            <select id="subadmin-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-white`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </form>
    </SlideOverPanel>
  );
}
