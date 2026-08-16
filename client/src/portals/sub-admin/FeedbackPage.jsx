import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchFeedback } from '../../services/feedbackService';
import ExportButtons from '../../components/ExportButtons';

// Same table shell as sub-admin/BatchesPage.jsx and AttendanceReportsPage.jsx
// (GRID_COLS approach, same classes). Filters are trainer + rating instead
// of search/status. The trainer-averages strip at the top is what makes
// this a decision-making screen rather than a log — it's computed
// server-side over the whole campus (see feedbackController.getFeedback's
// `campusFilter`), so it stays stable while the table below is filtered.

const RATING_OPTIONS = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

function Stars({ value }) {
  return (
    <span className="text-body-sm tracking-tight" style={{ color: '#C9A227' }}>
      {'★'.repeat(value)}
      <span className="text-neutral-400">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

function avgTone(avg) {
  if (avg >= 4) return 'text-success-text';
  if (avg >= 3) return 'text-warning-text';
  return 'text-danger-600';
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.3fr_1.1fr_1.3fr_0.9fr_2fr_0.9fr]';

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

const EXPORT_COLUMNS = [
  { header: 'Student', accessor: (f) => f.student?.name },
  { header: 'Trainer', accessor: (f) => f.trainer },
  { header: 'Batch', accessor: (f) => f.batch?.schedule },
  { header: 'Rating', accessor: (f) => f.rating },
  { header: 'Comment', accessor: (f) => f.comment },
  { header: 'Date', accessor: (f) => (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '') },
];

export default function FeedbackPage() {
  const [trainer, setTrainer] = useState('all');
  const [rating, setRating] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-feedback', { trainer, rating, page }],
    queryFn: () => fetchFeedback({ trainer: trainer === 'all' ? undefined : trainer, rating, page, limit: 8 }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;
  const trainerAverages = data?.trainerAverages ?? [];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3.5">
        <div className="font-heading font-bold text-h6 text-neutral-900">Average Rating by Trainer</div>
        {trainerAverages.length === 0 ? (
          <div className="text-body-sm text-neutral-400">No feedback recorded for this campus yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {trainerAverages.map((t) => (
              <div key={t.trainer} className="border border-neutral-100 rounded-lg p-3.5 flex flex-col gap-1.5">
                <span className="text-caption font-semibold text-neutral-900 truncate">{t.trainer}</span>
                <span className={`font-heading text-h5 ${avgTone(t.avgRating)}`}>{t.avgRating.toFixed(1)}</span>
                <span className="text-badge text-neutral-400 font-normal">
                  {t.count} review{t.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={trainer}
            onChange={(e) => {
              setTrainer(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All trainers</option>
            {trainerAverages.map((t) => (
              <option key={t.trainer} value={t.trainer}>
                {t.trainer}
              </option>
            ))}
          </select>
          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <ExportButtons title="Feedback" filenameBase="titan-feedback" columns={EXPORT_COLUMNS} rows={items} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Trainer', 'Batch', 'Rating', 'Comment', 'Date'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load feedback. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No feedback matches this filter.</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {items.map((f) => (
              <motion.div
                key={f._id}
                variants={fadeInUp}
                className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
              >
                <span className="text-body-sm font-semibold text-neutral-900 truncate">{f.student?.name || '—'}</span>
                <span className="text-body-sm text-neutral-600 truncate">{f.trainer}</span>
                <span className="text-body-sm text-neutral-600 truncate">{f.batch?.schedule || '—'}</span>
                <Stars value={f.rating} />
                <span className="text-body-sm text-neutral-600 truncate" title={f.comment}>
                  {f.comment || '—'}
                </span>
                <span className="text-body-sm text-neutral-600">{fmtDate(f.createdAt)}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} review{total === 1 ? '' : 's'} · Page {page} of {pages}
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
