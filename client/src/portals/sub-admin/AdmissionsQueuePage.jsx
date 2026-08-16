import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdmissions, approveAdmission, rejectAdmission } from '../../services/admissionService';

// Card-per-applicant queue, same pattern as
// portals/super-admin/trainers/TrainersAttendanceRequest.jsx (the existing
// approve/reject-queue precedent in this codebase) rather than a table.

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function AdmissionsQueuePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admissions'],
    queryFn: () => getAdmissions({ limit: 50 }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, name }) =>
      (action === 'approve' ? approveAdmission(id) : rejectAdmission(id)).then((result) => ({ ...result, name })),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      if (variables.action === 'approve' && result.batchAssignment && !result.batchAssignment.assigned) {
        setNotice(
          result.batchAssignment.reason === 'no_seats_available'
            ? `${result.name} was approved, but every matching batch is full — assign one manually.`
            : `${result.name} was approved, but no batch exists yet for their course at this campus — assign one manually.`
        );
      } else {
        setNotice(null);
      }
    },
  });

  const isButtonPending = (id, action) =>
    actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === action;

  const applicants = data?.students ?? [];
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h5 text-neutral-900">Admissions Queue</div>
        {!isLoading && !isError && (
          <span className="text-body-sm text-neutral-400">
            {total} pending applicant{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {notice && (
        <div className="bg-warning-bg border border-warning-text/30 rounded-xl p-3 flex items-center justify-between gap-3 text-body-sm text-warning-text">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="border-none bg-transparent text-warning-text cursor-pointer text-caption font-semibold shrink-0 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">
          Couldn't load admissions. Please try again.
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          No pending admissions.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          {applicants.map((a) => (
            <motion.div
              key={a._id}
              variants={fadeInUp}
              className="bg-surface border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold text-neutral-900 truncate">{a.name}</span>
                <span className="text-caption text-neutral-500 font-normal">{a.course}</span>
                <span className="text-badge text-neutral-400 font-normal">Applied {fmtDate(a.createdAt)}</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key="actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 shrink-0"
                >
                  <button
                    type="button"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id: a._id, action: 'approve', name: a.name })}
                    className="border-none bg-gold-500 text-white text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isButtonPending(a._id, 'approve') ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id: a._id, action: 'reject' })}
                    className="border border-danger-200 bg-surface text-danger-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isButtonPending(a._id, 'reject') ? 'Rejecting...' : 'Reject'}
                  </button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
