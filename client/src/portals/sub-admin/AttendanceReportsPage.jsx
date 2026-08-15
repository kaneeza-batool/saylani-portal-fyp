import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getAttendanceReports } from '../../services/studentAttendanceService';
import { fetchSlots } from '../../services/slotService';
import ExportButtons from '../../components/ExportButtons';

// Same table shell as sub-admin/BatchesPage.jsx (GRID_COLS approach, same
// classes) — filters are a date range + batch instead of search/status,
// since there's no free-text field worth searching on a per-student
// attendance row. Batch options come from fetchSlots, already campus-scoped
// server-side for sub_admin (see slotRoutes.js); percentage/leave logic
// mirrors studentAttendanceController.getAttendanceReports exactly — leave
// excluded from the denominator, null (not 0%) when present+absent is 0.

function toDateInputValue(d) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
}

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.6fr_1.6fr_0.8fr_0.8fr_0.8fr_1fr]';

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
  { header: 'Student', accessor: (r) => r.name },
  { header: 'Batch', accessor: (r) => r.batch?.schedule },
  { header: 'Present', accessor: (r) => r.present },
  { header: 'Absent', accessor: (r) => r.absent },
  { header: 'Leave', accessor: (r) => r.leave },
  { header: 'Attendance %', accessor: (r) => r.percentage ?? '' },
];

function pctLabel(pct) {
  if (pct == null) return '—';
  const tone = pct >= 75 ? 'text-success-text' : pct >= 60 ? 'text-warning-text' : 'text-danger-600';
  return <span className={`font-semibold ${tone}`}>{pct}%</span>;
}

export default function AttendanceReportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [batch, setBatch] = useState('all');
  const [batchOptions, setBatchOptions] = useState([]);

  useEffect(() => {
    fetchSlots({ status: 'active', limit: 100 })
      .then((data) => setBatchOptions(data.items ?? []))
      .catch(() => setBatchOptions([]));
  }, []);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-attendance-reports', { ...range, batch }],
    queryFn: () =>
      getAttendanceReports({
        startDate: range.startDate,
        endDate: range.endDate,
        batch: batch === 'all' ? undefined : batch,
      }),
  });

  const rows = data?.rows ?? [];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-caption font-semibold text-neutral-600">From</label>
            <input
              type="date"
              value={range.startDate}
              max={range.endDate}
              onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
              className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-caption font-semibold text-neutral-600">To</label>
            <input
              type="date"
              value={range.endDate}
              min={range.startDate}
              max={toDateInputValue(new Date())}
              onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
              className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All batches</option>
            {batchOptions.map((b) => (
              <option key={b._id} value={b._id}>
                {b.schedule}
              </option>
            ))}
          </select>
        </div>

        <ExportButtons title="Attendance Reports" filenameBase="titan-attendance-reports" columns={EXPORT_COLUMNS} rows={rows} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Batch', 'Present', 'Absent', 'Leave', 'Attendance %'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load attendance reports. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No students match this filter.</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {rows.map((r) => (
              <motion.div
                key={r.studentId}
                variants={fadeInUp}
                className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
              >
                <span className="text-body-sm font-semibold text-neutral-900 truncate">{r.name}</span>
                <span className="text-body-sm text-neutral-600 truncate">{r.batch?.schedule || '—'}</span>
                <span className="text-body-sm text-neutral-600">{r.present}</span>
                <span className="text-body-sm text-neutral-600">{r.absent}</span>
                <span className="text-body-sm text-neutral-600">{r.leave}</span>
                <span className="text-body-sm">{pctLabel(r.percentage)}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && rows.length > 0 && (
        <div className="text-body-sm text-neutral-400">
          {rows.length} student{rows.length === 1 ? '' : 's'} · {range.startDate} to {range.endDate}
        </div>
      )}
    </motion.div>
  );
}
