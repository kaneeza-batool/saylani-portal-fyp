import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchAlerts } from '../../services/alertService';

// Same table shell as sub-admin/BatchesPage.jsx and FeedbackPage.jsx
// (GRID_COLS approach, same classes) — the super-admin AlertsPage.jsx uses
// a different card-list layout with a Resolve button, but ALERTS is
// read-only for sub_admin (see User.js permissionShape), so this follows
// the grid-table convention the rest of this portal already uses instead,
// with no action column. campusScope + checkPermission('ALERTS','read') on
// GET /admin/alerts does the actual scoping server-side (alertController.js).

const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

const SEVERITY_STYLE = {
  critical: { label: 'Critical', className: 'bg-danger-50 text-danger-600' },
  warning: { label: 'Warning', className: 'bg-warning-bg text-warning-text' },
};

const STATUS_STYLE = {
  active: { label: 'Active', className: 'bg-warning-bg text-warning-text' },
  resolved: { label: 'Resolved', className: 'bg-success-bg text-success-text' },
};

const TYPE_LABEL = { attendance: 'Attendance', payment: 'Payment' };

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[0.8fr_0.8fr_1.2fr_2.5fr_0.8fr_1fr]';

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [status, setStatus] = useState('active');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sub-admin-alerts', { status }],
    queryFn: () => fetchAlerts({ status }),
  });

  const items = data?.items ?? [];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-caption text-neutral-400">
            System-detected — 3+ consecutive absences or overdue payment, checked automatically every 2 minutes.
          </span>
        </div>
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Type', 'Severity', 'Student', 'Message', 'Status', 'Date'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load alerts. Please try again.</span>
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
            {status === 'active' ? "No active alerts — everything's on track." : 'No alerts in this view.'}
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {items.map((a) => {
              const sev = SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.warning;
              const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.active;
              return (
                <motion.div
                  key={a._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <span className="text-body-sm text-neutral-600">{TYPE_LABEL[a.type] ?? a.type}</span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${sev.className}`}>{sev.label}</span>
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{a.studentName}</span>
                  <span className="text-body-sm text-neutral-600 truncate" title={a.message}>
                    {a.message}
                  </span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${st.className}`}>{st.label}</span>
                  <span className="text-body-sm text-neutral-600">{fmtDate(a.createdAt)}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
