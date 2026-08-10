import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchAuditLogs } from '../services/auditLogService';

const ACTION_STYLE = {
  create: { label: 'Created', className: 'bg-success-bg text-success-text' },
  update: { label: 'Updated', className: 'bg-info-bg text-info-text' },
  delete: { label: 'Deleted', className: 'bg-danger-50 text-danger-600' },
};

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

function fmt(d) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Shared list for Audit Log (fixedAction=null, shows an action filter) and
// Updation (fixedAction='update', no filter — it IS the filter).
export default function AuditLogList({ fixedAction = null, emptyText }) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState(fixedAction || 'all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [search, action]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', { search, action: fixedAction || action, page }],
    queryFn: () => fetchAuditLogs({ search, action: fixedAction || action, page, limit: 15 }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[280px] focus-within:border-gold-500 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search actions..."
            className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
          />
        </div>
        {!fixedAction && (
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
        )}
      </div>

      <motion.div variants={fadeInUp} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="px-[18px] py-3.5 border-b border-neutral-100">
                <div className="h-3 w-2/3 bg-neutral-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load the log. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">{emptyText || 'No activity recorded yet.'}</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {items.map((log) => {
              const a = ACTION_STYLE[log.action] ?? ACTION_STYLE.update;
              return (
                <motion.div
                  key={log._id}
                  variants={fadeInUp}
                  className="flex items-center justify-between gap-3 px-[18px] py-3.5 border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-badge px-2.5 py-1 rounded-pill shrink-0 ${a.className}`}>{a.label}</span>
                    <span className="text-body-sm text-neutral-900 truncate">{log.summary}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-caption text-neutral-500 font-normal">{log.actorName}</span>
                    <span className="text-badge text-neutral-400 font-normal">{fmt(log.createdAt)}</span>
                  </div>
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
    </div>
  );
}
