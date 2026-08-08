import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

const EMPTY_FORM = { requestedCheckIn: '', requestedCheckOut: '', reason: '' };

// Used from Trainer Attendance > View Attendance (edit icon) to raise a
// correction request against a specific TrainerAttendance record.
export default function AttendanceCorrectionModal({ open, record, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open, record]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      trainerAttendanceId: record._id,
      requestedCheckIn: form.requestedCheckIn ? new Date(form.requestedCheckIn).toISOString() : null,
      requestedCheckOut: form.requestedCheckOut ? new Date(form.requestedCheckOut).toISOString() : null,
      reason: form.reason,
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title="Request Correction"
      onClose={onClose}
      formId="correction-form"
      saveLabel="Submit Request"
      submitting={submitting}
      error={error}
    >
      {record && (
        <div className="text-body-sm text-neutral-600 bg-neutral-50 border border-neutral-100 rounded px-3 py-2">
          {record.trainerName} — {record.campus || 'No campus'}
        </div>
      )}
      <form id="correction-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="corr-checkin">
            Corrected check-in
          </label>
          <input id="corr-checkin" type="datetime-local" value={form.requestedCheckIn} onChange={setField('requestedCheckIn')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="corr-checkout">
            Corrected check-out
          </label>
          <input id="corr-checkout" type="datetime-local" value={form.requestedCheckOut} onChange={setField('requestedCheckOut')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="corr-reason">
            Reason
          </label>
          <textarea
            id="corr-reason"
            required
            rows={3}
            value={form.reason}
            onChange={setField('reason')}
            placeholder="Enter reason for correction..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </form>
    </SlideOverPanel>
  );
}
