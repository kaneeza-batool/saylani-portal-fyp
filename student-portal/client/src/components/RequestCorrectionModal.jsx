import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { createAttendanceRequest } from '../services/attendanceRequestService';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
];

function initialState(record) {
  // Default to whichever status isn't already the marked one, so the form
  // never opens pre-filled with "no change requested".
  const firstDifferent = STATUS_OPTIONS.find((o) => o.value !== record?.status)?.value || 'present';
  return { requestedStatus: firstDifferent, reason: '', error: '' };
}

// Raised from the Attendance page against one of the student's own days —
// writes straight into the shared studentattendancerequests collection
// Super Admin/Sub-Admin read from (see server/controllers/
// studentAttendanceRequestController.js on the main app).
export default function RequestCorrectionModal({ open, record, onClose }) {
  const [state, setState] = useState(() => initialState(record));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => createAttendanceRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] });
      handleClose();
    },
    onError: (err) => {
      setState((s) => ({ ...s, error: err.response?.data?.message || 'Failed to submit your request.' }));
    },
  });

  function handleClose() {
    setState(initialState(record));
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!state.reason.trim()) {
      setState((s) => ({ ...s, error: 'Please explain what should be corrected.' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));
    mutation.mutate({
      attendanceRecordId: record._id,
      requestedStatus: state.requestedStatus,
      reason: state.reason.trim(),
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request Attendance Correction"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="request-correction-form"
            disabled={mutation.isPending}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </>
      }
    >
      <form id="request-correction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {state.error && <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{state.error}</div>}

        {record && (
          <div className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-md px-3.5 py-2.5">
            {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — currently marked{' '}
            <strong className="text-neutral-800">{record.status}</strong>
          </div>
        )}

        <div>
          <label className={labelClass}>Should actually be*</label>
          <select
            value={state.requestedStatus}
            onChange={(e) => setState((s) => ({ ...s, requestedStatus: e.target.value }))}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Reason*</label>
          <textarea
            value={state.reason}
            onChange={(e) => setState((s) => ({ ...s, reason: e.target.value }))}
            rows={4}
            placeholder="Explain why this day's status should be corrected..."
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}
