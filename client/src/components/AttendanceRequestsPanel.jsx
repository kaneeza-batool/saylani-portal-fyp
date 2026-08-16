import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAttendanceRequests, resolveAttendanceRequest } from '../services/attendanceRequestService';
import { fetchStudentAttendanceRequests, resolveStudentAttendanceRequest } from '../services/studentAttendanceRequestService';

const STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  approved: { label: 'Approved', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

function fmt(d) {
  return d ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

// Shared by Super Admin (sees every campus) and Sub-Admin (campus-scoped
// server-side, same component either way) — a trainer disputing their own
// check-in/out and a student disputing their own daily attendance are
// different data shapes, so this switches between two independent
// list+resolve endpoints rather than trying to force one schema on both,
// but presents them through the one panel so there's a single place to
// come approve either kind.
export default function AttendanceRequestsPanel() {
  const queryClient = useQueryClient();
  const [type, setType] = useState('trainer');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [type, status]);

  const isTrainer = type === 'trainer';

  const { data, isLoading, isError } = useQuery({
    queryKey: [isTrainer ? 'attendance-requests' : 'student-attendance-requests', { status, page }],
    queryFn: () =>
      isTrainer ? fetchAttendanceRequests({ status, page, limit: 10 }) : fetchStudentAttendanceRequests({ status, page, limit: 10 }),
    keepPreviousData: true,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status: s }) => (isTrainer ? resolveAttendanceRequest(id, s) : resolveStudentAttendanceRequest(id, s)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [isTrainer ? 'attendance-requests' : 'student-attendance-requests'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: [isTrainer ? 'attendance-requests' : 'student-attendance-requests'] }),
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex border border-neutral-200 rounded overflow-hidden">
          {[
            { key: 'trainer', label: 'Trainer Requests' },
            { key: 'student', label: 'Student Requests' },
          ].map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={[
                'px-3.5 py-[9px] text-body-sm font-semibold cursor-pointer transition-colors',
                i > 0 ? 'border-l border-neutral-200' : '',
                type === t.key ? 'bg-gold-500 text-white' : 'bg-surface text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
        >
          <option value="all">All requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 w-full bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">
          Couldn't load requests. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          No {isTrainer ? 'trainer' : 'student'} attendance correction requests.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          {items.map((r) => {
            const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
            return (
              <motion.div
                key={r._id}
                variants={fadeInUp}
                className="bg-surface border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-semibold text-neutral-900">{isTrainer ? r.trainerName : r.studentName}</span>
                    <span className={`text-badge px-2.5 py-1 rounded-pill ${s.className}`}>{s.label}</span>
                  </div>
                  <span className="text-caption text-neutral-500 font-normal">
                    {r.campus || 'No campus'}
                    {!isTrainer && r.rollNumber ? ` · Roll #${r.rollNumber}` : ''}
                  </span>
                  <span className="text-caption text-neutral-600 font-normal">{r.reason}</span>
                  {isTrainer ? (
                    <span className="text-badge text-neutral-400 font-normal">
                      Requested: {fmt(r.requestedCheckIn)} → {fmt(r.requestedCheckOut)}
                    </span>
                  ) : (
                    <span className="text-badge text-neutral-400 font-normal">
                      {fmtDate(r.date)} — {r.currentStatus} → {r.requestedStatus}
                    </span>
                  )}
                  {r.status !== 'pending' && r.resolvedByName && (
                    <span className="text-badge text-neutral-400 font-normal">
                      Resolved by {r.resolvedByName} ({r.resolvedByRole === 'super_admin' ? 'Super Admin' : 'Sub-Admin'})
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {r.status === 'pending' ? (
                    <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate({ id: r._id, status: 'approved' })}
                        className="border-none bg-gold-500 text-white text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate({ id: r._id, status: 'rejected' })}
                        className="border border-danger-200 bg-surface text-danger-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {resolveMutation.isError && (
        <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">
          {resolveMutation.error?.response?.data?.message || 'This request was already resolved by someone else.'}
        </div>
      )}

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} request{total === 1 ? '' : 's'} · Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
