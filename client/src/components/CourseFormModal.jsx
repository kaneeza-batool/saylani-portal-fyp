import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { name: '', description: '', durationWeeks: 8, status: 'active' };

export default function CourseFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [open, initialValues]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, durationWeeks: Number(form.durationWeeks) || 1 });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Course' : 'Edit Course'}
      onClose={onClose}
      formId="course-form"
      saveLabel={mode === 'add' ? 'Add Course' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="course-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="course-name">
            Course name
          </label>
          <input id="course-name" type="text" required value={form.name} onChange={setField('name')} placeholder="e.g. Web Development" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="course-description">
            Description
          </label>
          <input id="course-description" type="text" value={form.description} onChange={setField('description')} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="course-duration">
              Duration (weeks)
            </label>
            <input
              id="course-duration"
              type="number"
              min="1"
              required
              value={form.durationWeeks}
              onChange={setField('durationWeeks')}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="course-status">
              Status
            </label>
            <select id="course-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-white`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </SlideOverPanel>
  );
}
