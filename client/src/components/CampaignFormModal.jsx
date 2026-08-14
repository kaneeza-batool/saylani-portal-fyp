import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { title: '', category: '', description: '', goalAmount: '', status: 'active', published: false };

export default function CampaignFormModal({ open, mode = 'add', initialValues, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [open, initialValues]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, goalAmount: Number(form.goalAmount) });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'add' ? 'Add Campaign' : 'Edit Campaign'}
      onClose={onClose}
      formId="campaign-form"
      saveLabel={mode === 'add' ? 'Add Campaign' : 'Save Changes'}
      submitting={submitting}
      error={error}
    >
      <form id="campaign-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campaign-title">
            Campaign title
          </label>
          <input
            id="campaign-title"
            type="text"
            required
            value={form.title}
            onChange={setField('title')}
            placeholder="e.g. Scholarship Fund 2026"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campaign-category">
            Category
          </label>
          <input
            id="campaign-category"
            type="text"
            value={form.category}
            onChange={setField('category')}
            placeholder="e.g. Scholarships, Equipment, Research"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="campaign-goal">
              Goal amount (Rs.)
            </label>
            <input id="campaign-goal" type="number" min="0" required value={form.goalAmount} onChange={setField('goalAmount')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={labelClass} htmlFor="campaign-status">
              Status
            </label>
            <select id="campaign-status" value={form.status} onChange={setField('status')} className={`${inputClass} bg-surface`}>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="campaign-description">
            Description
          </label>
          <textarea
            id="campaign-description"
            rows={4}
            value={form.description}
            onChange={setField('description')}
            placeholder="What this campaign funds and why it matters..."
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="w-4 h-4 accent-gold-500 cursor-pointer"
          />
          <span className="text-body-sm text-neutral-700">Published (visible on the public donate page)</span>
        </label>
      </form>
    </SlideOverPanel>
  );
}
