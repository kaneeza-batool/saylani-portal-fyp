import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from '../portals/trainer/formFieldStyles';

const EMPTY_FORM = { title: '', description: '', course: '', dueDate: '', isHackathon: false, referenceLinksText: '' };

// Same SlideOverPanel pattern as CampaignFormModal.jsx/StudentFormModal.jsx
// — a slide-over from the right is this app's existing "modal" convention,
// reused here rather than introducing a centered-dialog pattern that
// wouldn't match anything else in the app.
export default function AssignmentFormModal({ open, courses, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm({ ...EMPTY_FORM, course: courses?.[0]?.name || '' });
  }, [open, courses]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      course: form.course,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : '',
      isHackathon: form.isHackathon,
      referenceLinks: form.referenceLinksText.split('\n').map((l) => l.trim()).filter(Boolean),
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title="New Assignment"
      onClose={onClose}
      formId="assignment-form"
      saveLabel="Create Assignment"
      submitting={submitting}
      error={error}
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="assignment-title">
            Title
          </label>
          <input
            id="assignment-title"
            type="text"
            required
            value={form.title}
            onChange={setField('title')}
            placeholder="e.g. Build a Portfolio Site"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="assignment-description">
            Description
          </label>
          <textarea
            id="assignment-description"
            required
            rows={4}
            value={form.description}
            onChange={setField('description')}
            placeholder="What the student needs to do, and how it'll be evaluated"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="assignment-course">
              Batch / Course
            </label>
            <select id="assignment-course" value={form.course} onChange={setField('course')} className={`${inputClass} bg-surface`}>
              {!courses?.length && <option value="">Loading…</option>}
              {courses?.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="assignment-due">
              Due Date
            </label>
            <input id="assignment-due" type="date" required value={form.dueDate} onChange={setField('dueDate')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="assignment-links">
            Reference Links (one per line, optional)
          </label>
          <textarea
            id="assignment-links"
            rows={2}
            value={form.referenceLinksText}
            onChange={setField('referenceLinksText')}
            placeholder="https://..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isHackathon}
            onChange={(e) => setForm((f) => ({ ...f, isHackathon: e.target.checked }))}
            className="w-4 h-4 accent-[var(--trainer-blue)] cursor-pointer"
          />
          <span className="text-body-sm text-neutral-700">This is a hackathon-style assignment</span>
        </label>
      </form>
    </SlideOverPanel>
  );
}
