import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { title: '', course: '', campus: '', attempts: 0, avg: 0, status: 'Scheduled' };

export default function QuizFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [open, initialValues]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, attempts: Number(form.attempts) || 0, avg: Number(form.avg) || 0 });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Quiz' : 'Edit Quiz'}
      onClose={onClose}
      formId="quiz-form"
      saveLabel={mode === 'add' ? 'Add Quiz' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="quiz-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="quiz-title">
            Quiz title
          </label>
          <input id="quiz-title" type="text" required value={form.title} onChange={setField('title')} placeholder="e.g. Python Foundations Quiz" className={inputClass} />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="quiz-course">
              Course
            </label>
            <input id="quiz-course" type="text" required value={form.course} onChange={setField('course')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="quiz-campus">
              Campus
            </label>
            <input id="quiz-campus" type="text" required value={form.campus} onChange={setField('campus')} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="quiz-attempts">
              Attempts
            </label>
            <input id="quiz-attempts" type="number" min="0" value={form.attempts} onChange={setField('attempts')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="quiz-avg">
              Average score (%)
            </label>
            <input id="quiz-avg" type="number" min="0" max="100" value={form.avg} onChange={setField('avg')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="quiz-status">
            Status
          </label>
          <select id="quiz-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-white`}>
            <option value="Scheduled">Scheduled</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </form>
    </SlideOverPanel>
  );
}
