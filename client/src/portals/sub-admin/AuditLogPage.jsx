import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchAuditLogs } from '../../services/auditLogService';
import ExportButtons from '../../components/ExportButtons';

// Same table shell as sub-admin/AlertsPage.jsx and FeedbackPage.jsx
// (GRID_COLS approach, same classes). Scoping is entirely server-side —
// campusScope + checkPermission('AUDIT','read') on GET /admin/audit-logs
// (auditLogRoutes.js) does the actual filtering; this page just renders
// whatever campus-scoped page it gets back, with action-type and
// created-at date-range filters.

const ACTION_FILTERS = [
  { value: 'all', label: 'All actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
];

const ACTION_STYLE = {
  create: { label: 'Created', className: 'bg-success-bg text-success-text' },
  update: { label: 'Updated', className: 'bg-info-bg text-info-text' },
  delete: { label: 'Deleted', className: 'bg-danger-50 text-danger-600' },
};

function fmt(d) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1fr_0.7fr_0.9fr_2.4fr_1fr]';

const EXPORT_COLUMNS = [
  { header: 'Actor', accessor: (l) => l.actorName },
  { header: 'Action', accessor: (l) => l.action },
  { header: 'Record', accessor: (l) => l.resourceType },
  { header: 'Summary', accessor: (l) => l.summary },
  { header: 'Date', accessor: (l) => new Date(l.createdAt).toLocaleString() },
];

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function AuditLogPage() {
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-audit-logs', { action, startDate, endDate, page }],
    queryFn: () => fetchAuditLogs({ action, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 15 }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  const resetPage = () => setPage(1);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              resetPage();
            }}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            {ACTION_FILTERS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              resetPage();
            }}
            max={endDate || undefined}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          />
          <span className="text-caption text-neutral-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              resetPage();
            }}
            min={startDate || undefined}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                resetPage();
              }}
              className="border-none bg-transparent text-caption font-semibold text-neutral-500 cursor-pointer hover:text-neutral-900 transition-colors"
            >
              Clear dates
            </button>
          )}
        </div>

        <ExportButtons title="Audit Log" filenameBase="titan-subadmin-audit-log" columns={EXPORT_COLUMNS} rows={items} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Actor', 'Action', 'Record', 'Summary', 'Date'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load the audit log. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">
            {action !== 'all' || startDate || endDate
              ? 'No activity matches this filter.'
              : 'No admin activity recorded for your campus yet.'}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {items.map((log) => {
              const a = ACTION_STYLE[log.action] ?? ACTION_STYLE.update;
              return (
                <motion.div
                  key={log._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{log.actorName}</span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${a.className}`}>{a.label}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{log.resourceType}</span>
                  <span className="text-body-sm text-neutral-600 truncate" title={log.summary}>
                    {log.summary}
                  </span>
                  <span className="text-body-sm text-neutral-600">{fmt(log.createdAt)}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} entr{total === 1 ? 'y' : 'ies'} · Page {page} of {pages}
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
