import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAlerts, resolveAlert } from '../../services/alertService';

const TYPE_ICON = {
  attendance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
    </svg>
  ),
  payment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
};

const SEVERITY_STYLE = {
  critical: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-bg text-warning-text',
};

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

function fmt(d) {
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('active');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts', { status }],
    queryFn: () => fetchAlerts({ status }),
  });

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const items = data?.items ?? [];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        <span className="text-caption text-neutral-400">
          System-detected — 3+ consecutive absences or overdue payment, checked automatically every 2 minutes.
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-surface border border-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load alerts.</div>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          {status === 'active' ? "No active alerts — everything's on track." : 'No alerts in this view.'}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {items.map((a) => (
              <motion.div
                key={a._id}
                variants={fadeInUp}
                exit={{ opacity: 0, height: 0 }}
                className="bg-surface border border-neutral-200 rounded-xl p-4 flex items-center gap-3.5"
              >
                <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${SEVERITY_STYLE[a.severity]}`}>{TYPE_ICON[a.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm text-neutral-900">{a.message}</div>
                  <div className="text-badge text-neutral-400 font-normal">{fmt(a.createdAt)}</div>
                </div>
                {a.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => resolveMutation.mutate(a._id)}
                    disabled={resolveMutation.isPending}
                    className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 shrink-0"
                  >
                    Resolve
                  </button>
                ) : (
                  <span className="text-badge px-2.5 py-1 rounded-pill bg-success-bg text-success-text shrink-0">Resolved</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
