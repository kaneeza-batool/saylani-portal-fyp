import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchFees, updateFeeVoucher } from '../../services/feeService';
import ExportButtons from '../../components/ExportButtons';

// Same table shell as AttendanceReportsPage.jsx/FeedbackPage.jsx (GRID_COLS
// approach, same classes). Reused directly at /admin/fees for super_admin,
// same "no sub-admin-specific fork needed, backend enforces campus scope"
// convention as MarkAttendance/MultiAttendance in App.jsx — campusScope
// already resolves super_admin to an unscoped filter server-side.
//
// Each row IS one editable voucher (unlike AttendanceReportsPage, where one
// summary row expands into N day-records to edit) — so the due-date input
// and Mark Paid button live directly in the row instead of behind a
// View/Edit toggle. Still the same "click/change saves immediately, no
// separate submit step" convention as the attendance correction.

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.3fr_0.8fr_1fr_0.9fr_0.9fr_1.1fr_1.3fr]';

function formatAmount(n) {
  return `Rs. ${n.toLocaleString('en-US')}`;
}

function toDateInputValue(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function StatusPill({ status, overdue }) {
  if (status === 'paid') {
    return <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-badge font-semibold bg-success-bg text-success-text">Paid</span>;
  }
  if (overdue) {
    return <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-badge font-semibold bg-danger-50 text-danger-600">Overdue</span>;
  }
  return <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-badge font-semibold bg-warning-bg text-warning-text">Pending</span>;
}

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[820px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

const EXPORT_COLUMNS = [
  { header: 'Student', accessor: (v) => v.student?.name },
  { header: 'Roll Number', accessor: (v) => v.student?.rollNumber },
  { header: 'Batch', accessor: (v) => v.batch?.schedule },
  { header: 'Month', accessor: (v) => v.month },
  { header: 'Amount', accessor: (v) => v.amount },
  { header: 'Due Date', accessor: (v) => new Date(v.dueDate).toLocaleDateString() },
  { header: 'Status', accessor: (v) => (v.overdue ? 'overdue' : v.status) },
];

function SummaryCard({ label, value, tone }) {
  return (
    <div className="border border-neutral-100 rounded-lg p-3.5 flex flex-col gap-1.5">
      <span className="text-caption font-semibold text-neutral-600">{label}</span>
      <span className={`font-heading text-h5 ${tone}`}>{value}</span>
    </div>
  );
}

function FeeRow({ voucher, onUpdate, isSaving }) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`grid ${GRID_COLS} min-w-[820px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
    >
      <span className="text-body-sm font-semibold text-neutral-900 truncate">{voucher.student?.name || '—'}</span>
      <span className="text-body-sm text-neutral-600 truncate">{voucher.student?.rollNumber ?? '—'}</span>
      <span className="text-body-sm text-neutral-600 truncate">{voucher.batch?.schedule || '—'}</span>
      <span className="text-body-sm text-neutral-600 truncate">{voucher.month}</span>
      <span className="text-body-sm text-neutral-600">{formatAmount(voucher.amount)}</span>
      <input
        type="date"
        value={toDateInputValue(voucher.dueDate)}
        disabled={isSaving}
        onChange={(e) => e.target.value && onUpdate({ dueDate: e.target.value })}
        className="border border-neutral-200 rounded px-2 py-[7px] text-caption text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors disabled:opacity-50 w-fit"
      />
      <div className="flex items-center gap-2">
        <StatusPill status={voucher.status} overdue={voucher.overdue} />
        {voucher.status === 'pending' && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onUpdate({ status: 'paid' })}
            className="border-none bg-gold-500 text-white text-badge font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Paid
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function FeesPage() {
  const [status, setStatus] = useState('all');
  const [month, setMonth] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['fees', { status, month }],
    queryFn: () => fetchFees({ status, month: month === 'all' ? undefined : month }),
  });

  const vouchers = data?.vouchers ?? [];
  const months = data?.months ?? [];
  const summary = data?.summary ?? { totalCollected: 0, totalPending: 0, overdueCount: 0 };

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => updateFeeVoucher(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Total Collected" value={formatAmount(summary.totalCollected)} tone="text-success-text" />
        <SummaryCard label="Total Pending" value={formatAmount(summary.totalPending)} tone="text-warning-text" />
        <SummaryCard label="Overdue Vouchers" value={summary.overdueCount} tone="text-danger-600" />
      </motion.div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <ExportButtons title="Fees" filenameBase="titan-fees" columns={EXPORT_COLUMNS} rows={vouchers} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[820px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Roll No.', 'Batch', 'Month', 'Amount', 'Due Date', 'Status'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load fees. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No fee vouchers match this filter.</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {vouchers.map((v) => (
              <FeeRow
                key={v._id}
                voucher={v}
                isSaving={editMutation.isPending && editMutation.variables?.id === v._id}
                onUpdate={(payload) => editMutation.mutate({ id: v._id, payload })}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && vouchers.length > 0 && (
        <div className="text-body-sm text-neutral-400">
          {vouchers.length} voucher{vouchers.length === 1 ? '' : 's'}
        </div>
      )}
    </motion.div>
  );
}
