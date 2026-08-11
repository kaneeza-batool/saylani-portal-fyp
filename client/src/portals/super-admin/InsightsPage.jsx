import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchDropoutRisk } from '../../services/mlService';
import { useSocketData } from '../../context/SocketContext';

const RISK_STYLE = {
  high: { label: 'High Risk', className: 'bg-danger-50 text-danger-600', bar: 'from-danger-600 to-danger-600' },
  medium: { label: 'Medium Risk', className: 'bg-warning-bg text-warning-text', bar: 'from-warning-text to-warning-text' },
  low: { label: 'Low Risk', className: 'bg-success-bg text-success-text', bar: 'from-success-text to-success-text' },
};

const ACTION_STYLE = {
  create: { label: 'Created', className: 'bg-success-bg text-success-text' },
  update: { label: 'Updated', className: 'bg-info-bg text-info-text' },
  delete: { label: 'Deleted', className: 'bg-danger-50 text-danger-600' },
};

const FEATURE_LABEL = {
  attendanceRate: 'Attendance rate',
  paymentOverdue: 'Payment overdue',
  paymentPending: 'Payment pending',
  tenureMonths: 'Tenure (months, uncompleted)',
  statusPending: 'Stuck in pending status',
};

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const GRID_COLS = 'grid-cols-[1.4fr_1fr_1fr_1fr_0.9fr_0.9fr]';

function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ModelInfoCard({ modelInfo }) {
  const maxAbs = Math.max(...modelInfo.weights.map((w) => Math.abs(w)));
  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">Dropout Risk Model</div>
          <div className="text-body-sm text-neutral-400 mt-0.5">Logistic regression, trained from scratch</div>
        </div>
        <div className="flex gap-4 text-caption text-neutral-500">
          <span>
            <span className="font-semibold text-neutral-900">{modelInfo.trainingSamples}</span> training samples
          </span>
          <span>
            <span className="font-semibold text-neutral-900">{Math.round(modelInfo.trainAccuracy * 100)}%</span> accuracy
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {modelInfo.featureNames.map((name, i) => {
          const weight = modelInfo.weights[i];
          const widthPct = (Math.abs(weight) / maxAbs) * 100;
          const increasesRisk = weight > 0;
          return (
            <div key={name} className="flex items-center gap-3">
              <span className="text-caption text-neutral-600 w-[220px] shrink-0">{FEATURE_LABEL[name] || name}</span>
              <div className="flex-1 h-[8px] rounded-pill bg-neutral-100 overflow-hidden flex items-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-pill ${increasesRisk ? 'bg-danger-600' : 'bg-success-text'}`}
                />
              </div>
              <span className="text-badge text-neutral-400 font-normal w-[70px] text-right">
                {increasesRisk ? '+' : ''}
                {weight.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-caption text-neutral-400">Red bars increase dropout risk, green bars reduce it.</div>
    </motion.div>
  );
}

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function LiveActivityTicker() {
  const { liveAuditEvents, connected } = useSocketData();

  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h6 text-neutral-900">Live Activity</div>
        <div className="flex items-center gap-1.5 text-badge text-neutral-400">
          <span className={`w-[7px] h-[7px] rounded-full ${connected ? 'bg-success-text' : 'bg-neutral-300'}`} />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {liveAuditEvents.length === 0 ? (
        <div className="text-body-sm text-neutral-400">Waiting for activity — changes made anywhere in the app will appear here instantly.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2 max-h-[520px] overflow-y-auto">
          {liveAuditEvents.map((log) => {
            const a = ACTION_STYLE[log.action] ?? ACTION_STYLE.update;
            return (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2 text-body-sm"
              >
                <span className={`text-badge px-2 py-0.5 rounded-pill shrink-0 mt-0.5 ${a.className}`}>{a.label}</span>
                <div className="min-w-0">
                  <div className="text-neutral-900 truncate">{log.summary}</div>
                  <div className="text-badge text-neutral-400 font-normal">
                    {log.actorName} · {fmtTime(log.createdAt)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function InsightsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ml-dropout-risk'],
    queryFn: fetchDropoutRisk,
    refetchInterval: 60000,
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-[1.6fr_1fr] gap-4 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        {isLoading ? (
          <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] h-[180px] animate-pulse" />
        ) : isError ? (
          <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-body-sm text-danger-600">Couldn't load risk data.</div>
        ) : (
          <ModelInfoCard modelInfo={data.modelInfo} />
        )}

        <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
          <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
            {['Student', 'Course', 'Campus', 'Attendance', 'Payment'].map((h) => (
              <span key={h} className="text-overline uppercase text-neutral-500">
                {h}
              </span>
            ))}
            <span className="text-overline uppercase text-neutral-500">Risk</span>
          </div>

          {isLoading ? (
            [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
          ) : isError ? (
            <div className="py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load students.</div>
          ) : data.students.length === 0 ? (
            <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No active students to score yet.</div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              {data.students.map((s) => {
                const risk = RISK_STYLE[s.riskBand] ?? RISK_STYLE.low;
                return (
                  <motion.div
                    key={s.studentId}
                    variants={fadeInUp}
                    className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                  >
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</div>
                      <div className="text-badge text-neutral-400 font-normal">Roll {s.rollNumber}</div>
                    </div>
                    <span className="text-body-sm text-neutral-600 truncate">{s.course}</span>
                    <span className="text-body-sm text-neutral-600 truncate">{s.campus}</span>
                    <span className="text-body-sm text-neutral-600">{s.attendanceRate}%</span>
                    <span className="text-body-sm text-neutral-600 capitalize">{s.payment}</span>
                    <div className="flex flex-col gap-1">
                      <span className={`text-badge px-2 py-0.5 rounded-pill w-fit ${risk.className}`}>{s.riskScore}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <LiveActivityTicker />
    </motion.div>
  );
}
