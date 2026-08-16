import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { createAttendanceRequest } from '../services/attendanceRequestService';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function initialState() {
  return { date: todayInputValue(), requestedStatus: 'present', reason: '', error: '' };
}

// Fallback for when self-marking isn't available — no QR/ID scan went
// through, or the student didn't have their phone on them at the time.
// Submits a request Super Admin or Sub-Admin reviews and, on approval,
// creates the attendance record that self-marking would have written
// directly (see server/controllers/studentAttendanceRequestController.js's
// resolveRequest — attendanceRecord: null means "create one").
export default function RequestAttendanceModal({ open, onClose }) {
  const [state, setState] = useState(initialState);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => createAttendanceRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      handleClose();
    },
    onError: (err) => {
      setState((s) => ({ ...s, error: err.response?.data?.message || 'Failed to submit your request.' }));
    },
  });

  function handleClose() {
    setState(initialState());
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!state.reason.trim()) {
      setState((s) => ({ ...s, error: 'Please explain why you need this marked.' }));
      return;
    }
    setState((s) => ({ ...s, error: '' }));
    mutation.mutate({ date: state.date, requestedStatus: state.requestedStatus, reason: state.reason.trim() });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request Attendance"
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
            form="request-attendance-form"
            disabled={mutation.isPending}
            className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </>
      }
    >
      <form id="request-attendance-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {state.error && <div className="rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">{state.error}</div>}

        <p className="text-sm text-neutral-500">
          Use this if you couldn't self-mark your attendance (QR didn't scan, or you didn't have your phone). A campus admin will review it.
        </p>

        <div>
          <label className={labelClass}>Date*</label>
          <input
            type="date"
            value={state.date}
            max={todayInputValue()}
            onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Status*</label>
          <select
            value={state.requestedStatus}
            onChange={(e) => setState((s) => ({ ...s, requestedStatus: e.target.value }))}
            className={inputClass}
          >
            <option value="present">Present</option>
            <option value="leave">Leave</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Reason*</label>
          <textarea
            value={state.reason}
            onChange={(e) => setState((s) => ({ ...s, reason: e.target.value }))}
            rows={4}
            placeholder="e.g. My phone battery died before I could self-check-in in class."
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
}
