import { useEffect, useState } from 'react';
import SlideOverPanel from './SlideOverPanel';
import { inputClass, labelClass } from './formFieldStyles';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = { date: todayInputValue(), requestedCheckIn: '', requestedCheckOut: '', reason: '' };

// Trainer self-service only (portals/trainer/ProfilePage.jsx) — raises a
// pending AttendanceRequest for Super Admin/Sub-Admin to later approve/
// reject. Super Admin's own attendance view is read-only instead (see
// TrainersAttendanceView.jsx) — they already have full authority and
// resolve these same requests directly, so there's no separate "edit"
// shortcut that would just bypass the approval trail.
//
// Two modes, both submitting to the same createAttendanceRequest endpoint:
//  - `record` given (has an _id): correcting that specific existing
//    TrainerAttendance row — no date field, the record already has one.
//  - `record` omitted/null: requesting attendance for a day with no record
//    at all (a missed check-in) — shows a date picker instead, same
//    "attendanceRecord: null means create one" pattern student-portal's
//    RequestAttendanceModal already uses for students.
export default function AttendanceCorrectionModal({ open, record, onClose, onSubmit, submitting, error }) {
  const isNewDay = !record?._id;
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open, record]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...(isNewDay ? { date: form.date } : { trainerAttendanceId: record._id }),
      requestedCheckIn: form.requestedCheckIn ? new Date(form.requestedCheckIn).toISOString() : null,
      requestedCheckOut: form.requestedCheckOut ? new Date(form.requestedCheckOut).toISOString() : null,
      reason: form.reason,
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title={isNewDay ? 'Request Attendance' : 'Request Correction'}
      onClose={onClose}
      formId="correction-form"
      saveLabel="Submit Request"
      submitting={submitting}
      error={error}
    >
      {record && !isNewDay && (
        <div className="text-body-sm text-neutral-600 bg-neutral-50 border border-neutral-100 rounded px-3 py-2">
          {record.trainerName} — {record.campus || 'No campus'}
        </div>
      )}
      <form id="correction-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {isNewDay && (
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="corr-date">
              Date
            </label>
            <input
              id="corr-date"
              type="date"
              required
              max={todayInputValue()}
              value={form.date}
              onChange={setField('date')}
              className={inputClass}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="corr-checkin">
            {isNewDay ? 'Check-in' : 'Corrected check-in'}
          </label>
          <input id="corr-checkin" type="datetime-local" value={form.requestedCheckIn} onChange={setField('requestedCheckIn')} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="corr-checkout">
            {isNewDay ? 'Check-out' : 'Corrected check-out'}
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
