import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchStudentFeedback, respondToStudentFeedback } from '../services/studentFeedbackService';

const TYPE_LABEL = { bug: 'Bug', idea: 'Idea', other: 'Other' };
const TYPE_EMOJI = { bug: '🐛', idea: '💡', other: '💬' };

const STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  reviewed: { label: 'Reviewed', className: 'bg-info-bg text-info-text' },
  resolved: { label: 'Resolved', className: 'bg-success-bg text-success-text' },
};

const STUDENT_PORTAL_BASE = import.meta.env.VITE_STUDENT_PORTAL_URL_BASE;

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

function fmt(d) {
  return d ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

// Feedback images are uploaded to the Student Portal's own static server
// (port 5273), not this app's — see student-portal's supportFeedbackController.
function imageSrc(imageUrl) {
  return imageUrl ? `${STUDENT_PORTAL_BASE}${imageUrl}` : null;
}

function FeedbackCard({ item }) {
  const queryClient = useQueryClient();
  const [response, setResponse] = useState(item.adminResponse || '');
  const [status, setStatus] = useState(item.status);

  const mutation = useMutation({
    mutationFn: () => respondToStudentFeedback(item._id, { status, adminResponse: response }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student-feedback'] }),
  });

  const dirty = response !== (item.adminResponse || '') || status !== item.status;
  const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;

  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-lg leading-none shrink-0 mt-0.5">{TYPE_EMOJI[item.type]}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-sm font-semibold text-neutral-900">{TYPE_LABEL[item.type]}</span>
              <span className={`text-badge px-2.5 py-1 rounded-pill ${s.className}`}>{s.label}</span>
            </div>
            <span className="text-caption text-neutral-500 font-normal">
              {item.student?.name || 'Unknown student'}
              {item.student?.rollNumber ? ` · Roll #${item.student.rollNumber}` : ''} · {item.campus || 'No campus'}
            </span>
          </div>
        </div>
        <span className="text-badge text-neutral-400 font-normal shrink-0">{fmt(item.createdAt)}</span>
      </div>

      <p className="text-body-sm text-neutral-700 whitespace-pre-wrap">{item.text}</p>

      {item.imageUrl && (
        <img src={imageSrc(item.imageUrl)} alt="Attachment" className="w-24 h-24 object-cover rounded-md border border-neutral-200" />
      )}

      <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[7px] text-caption text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
          {item.respondedByName && (
            <span className="text-badge text-neutral-400 font-normal">
              Last response by {item.respondedByName} ({item.respondedByRole === 'super_admin' ? 'Super Admin' : 'Sub-Admin'})
            </span>
          )}
        </div>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={2}
          placeholder="Write a response the student will see..."
          className="w-full border border-neutral-200 rounded px-3 py-2 text-body-sm text-neutral-700 font-sans outline-none focus:border-gold-500 transition-colors resize-none"
        />
        <button
          type="button"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="self-start border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-[8px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Saving...' : mutation.isSuccess && !dirty ? 'Saved ✓' : 'Save Response'}
        </button>
      </div>
    </motion.div>
  );
}

// Shared by Super Admin (every campus) and Sub-Admin (campus-scoped
// server-side) — same component either way, same as AttendanceRequestsPanel.
export default function StudentFeedbackPanel() {
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [type, status]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-feedback', { type, status, page }],
    queryFn: () => fetchStudentFeedback({ type, status, page, limit: 10 }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
        >
          <option value="all">All types</option>
          <option value="bug">Bug</option>
          <option value="idea">Idea</option>
          <option value="other">Other</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">
          Couldn't load feedback. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          No student feedback yet.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          {items.map((item) => (
            <FeedbackCard key={item._id} item={item} />
          ))}
        </motion.div>
      )}

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} item{total === 1 ? '' : 's'} · Page {page} of {pages}
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
