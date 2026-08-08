import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { getDashboard } from '../../services/dashboardService';

const KPI_ICON = {
  students: { bg: 'bg-success-bg', color: 'text-success-text', emoji: '🎓' },
  campuses: { bg: 'bg-warning-bg', color: 'text-warning-text', emoji: '🏫' },
  placement: { bg: 'bg-info-bg', color: 'text-info-text', emoji: '💼' },
  pending: { bg: 'bg-danger-50', color: 'text-danger-600', emoji: '⏳' },
};

const DELTA_TONE = {
  positive: 'bg-success-bg text-success-text',
  warning: 'bg-warning-bg text-warning-text',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

function CardShell({ children, className = '', hover = false }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={hover ? { y: -3, boxShadow: '0 12px 26px rgba(16,35,28,0.10)' } : undefined}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`bg-white border border-neutral-200 rounded-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-neutral-100 rounded animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="w-[34px] h-[34px] rounded" />
            </div>
            <SkeletonBlock className="h-7 w-20" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
          <SkeletonBlock className="h-4 w-52" />
          <SkeletonBlock className="h-[170px] w-full" />
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
          <SkeletonBlock className="h-4 w-36" />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          <SkeletonBlock className="h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          <SkeletonBlock className="h-4 w-32" />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ kpi }) {
  const icon = KPI_ICON[kpi.icon] ?? KPI_ICON.students;
  return (
    <CardShell hover className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase text-neutral-500">{kpi.label}</span>
        <div className={`w-[34px] h-[34px] rounded flex items-center justify-center text-base ${icon.bg} ${icon.color}`}>
          {icon.emoji}
        </div>
      </div>
      <div className="font-heading text-h3 text-neutral-900">{kpi.value}</div>
      <div className="flex items-center gap-1.5">
        <span className={`text-badge px-2 py-0.5 rounded-pill ${DELTA_TONE[kpi.deltaTone] ?? DELTA_TONE.positive}`}>
          {kpi.delta}
        </span>
        <span className="text-badge text-neutral-400 font-normal">vs last month</span>
      </div>
    </CardShell>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-md shadow-card px-3 py-2 flex flex-col gap-1">
      <span className="text-caption text-neutral-900 font-semibold">{label}</span>
      {payload.map((p) => (
        <span key={p.dataKey} className="text-caption text-neutral-600" style={{ color: p.color }}>
          {p.name}: {p.value}
        </span>
      ))}
    </div>
  );
}

function TrendChart({ trend }) {
  return (
    <CardShell className="p-[22px] flex flex-col gap-4 col-span-1">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">Enrollment vs Placement Trend</div>
          <div className="text-body-sm text-neutral-400 mt-0.5">Last 6 months, all campuses</div>
        </div>
        <div className="flex gap-3.5">
          <div className="flex items-center gap-1.5 text-caption text-neutral-600">
            <span className="w-[9px] h-[9px] rounded-sm bg-royal-500" />
            Enrollment
          </div>
          <div className="flex items-center gap-1.5 text-caption text-neutral-600">
            <span className="w-[9px] h-[9px] rounded-sm bg-parrot-500" />
            Placement
          </div>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="h-[170px] flex items-center justify-center text-body-sm text-neutral-400">
          No trend data yet.
        </div>
      ) : (
        <div className="h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={5}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A9A93', fontSize: 11.5, fontWeight: 500 }}
              />
              <YAxis hide />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(16,35,28,0.04)' }} />
              <Bar
                dataKey="enrollment"
                name="Enrollment"
                fill="#2F6FE4"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="placement"
                name="Placement"
                fill="#7CB342"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}

function CampusPerformance({ campuses }) {
  return (
    <CardShell className="p-[22px] flex flex-col gap-3.5">
      <div className="font-heading font-bold text-h6 text-neutral-900">Campus Performance</div>

      {campuses.length === 0 ? (
        <div className="text-body-sm text-neutral-400">No campus data yet.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
          {campuses.map((c) => (
            <motion.div key={c.id} variants={fadeInUp} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold text-neutral-900">{c.name}</span>
                <span className="text-caption text-neutral-400 font-normal">{c.students.toLocaleString()} students</span>
              </div>
              <div className="h-[7px] rounded-pill bg-neutral-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-pill bg-gradient-to-r from-royal-500 to-royal-600"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </CardShell>
  );
}

function PendingApprovals({ approvals }) {
  const [resolved, setResolved] = useState({});

  const resolve = (id, outcome) => setResolved((prev) => ({ ...prev, [id]: outcome }));

  return (
    <CardShell className="p-[22px] flex flex-col gap-3.5">
      <div className="font-heading font-bold text-h6 text-neutral-900">Pending Approvals</div>

      {approvals.length === 0 ? (
        <div className="text-body-sm text-neutral-400">All caught up — nothing pending.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2">
          {approvals.map((a) => {
            const outcome = resolved[a.id];
            return (
              <motion.div
                key={a.id}
                variants={fadeInUp}
                className="flex items-center justify-between gap-3 p-3 border border-neutral-100 rounded-lg"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-micro uppercase text-warning-text tracking-wide">{a.type}</span>
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{a.name}</span>
                  <span className="text-caption text-neutral-400 font-normal">{a.detail}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {outcome ? (
                    <motion.span
                      key="resolved"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className={`text-caption px-2.5 py-1 rounded-pill shrink-0 ${
                        outcome === 'approved' ? 'bg-success-bg text-success-text' : 'bg-danger-50 text-danger-600'
                      }`}
                    >
                      {outcome === 'approved' ? 'Approved' : 'Rejected'}
                    </motion.span>
                  ) : (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-2 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => resolve(a.id, 'approved')}
                        className="border-none bg-royal-500 text-white text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-royal-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(a.id, 'rejected')}
                        className="border border-danger-200 bg-white text-danger-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-danger-50"
                      >
                        Reject
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </CardShell>
  );
}

function RecentActivity({ activity }) {
  return (
    <CardShell className="p-[22px] flex flex-col gap-3.5">
      <div className="font-heading font-bold text-h6 text-neutral-900">Recent Activity</div>

      {activity.length === 0 ? (
        <div className="text-body-sm text-neutral-400">No recent activity.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          {activity.map((act) => (
            <motion.div key={act.id} variants={fadeInUp} className="flex gap-2.5 items-start">
              <span className="w-[7px] h-[7px] rounded-full bg-royal-500 mt-1.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm text-neutral-900">{act.text}</span>
                <span className="text-badge text-neutral-400 font-normal">{act.time}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </CardShell>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3 items-start">
        <div className="text-body-sm text-danger-600">Couldn't load the dashboard. Please try again.</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="border-none bg-royal-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-royal-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, trend, campusPerformance, pendingApprovals, recentActivity } = data;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <TrendChart trend={trend} />
        <CampusPerformance campuses={campusPerformance} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PendingApprovals approvals={pendingApprovals} />
        <RecentActivity activity={recentActivity} />
      </div>
    </motion.div>
  );
}
