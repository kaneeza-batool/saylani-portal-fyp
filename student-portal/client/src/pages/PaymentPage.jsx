import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getFeeHistory } from '../services/feeService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { CopyIcon, PlayIcon, RefreshIcon } from '../components/icons';

const STEPS = [
  'Open JazzCash app',
  'Click More',
  'Go to Education tab',
  'Click Universities',
  'Select TITAN Education from the list',
  'Paste your Voucher ID',
  'Pay your fee',
];

const STATUS_STYLE = {
  paid: 'bg-success-bg text-success-text',
  pending: 'bg-warning-bg text-warning-text',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(n) {
  return `Rs. ${n.toLocaleString('en-US')}`;
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${STATUS_STYLE[status]}`}
    >
      {status === 'paid' ? 'Paid' : 'Pending'}
    </span>
  );
}

function CopyVoucherButton({ voucherId }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(voucherId);
    } catch {
      // clipboard API unavailable — fail silently, nothing else to do here
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        title="Copy voucher ID"
      >
        <CopyIcon className="w-4 h-4" />
      </button>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 text-white text-xs px-2 py-1">
          Copied!
        </span>
      )}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 last:border-b-0 animate-pulse">
      <div className="h-4 w-20 bg-neutral-200 rounded" />
      <div className="h-4 w-16 bg-neutral-200 rounded" />
      <div className="h-6 w-16 bg-neutral-200 rounded-pill" />
    </div>
  );
}

function ThisMonthCard({ voucher }) {
  if (!voucher) return null;
  const isPaid = voucher.status === 'paid';

  return (
    <div
      data-testid="this-month-card"
      className={`rounded-lg shadow-card p-5 sm:p-6 flex items-center justify-between gap-4 border ${
        isPaid ? 'bg-success-bg border-success-text/20' : 'bg-primary-900 border-primary-700'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide ${isPaid ? 'text-success-text/80' : 'text-white/50'}`}>
          This Month · {voucher.month}
        </p>
        <p className={`font-heading text-2xl sm:text-3xl font-bold mt-1 ${isPaid ? 'text-success-text' : 'text-white'}`}>
          {formatAmount(voucher.amount)}
        </p>
      </div>
      {isPaid ? (
        <span className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-bold bg-success-text/15 text-success-text shrink-0">
          Paid ✓
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-bold bg-accent-500 text-primary-900 shrink-0">
          Pending
        </span>
      )}
    </div>
  );
}

export default function PaymentPage() {
  const {
    data: vouchers,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['fee', 'history'],
    queryFn: () => getFeeHistory(),
  });

  const now = new Date();
  const thisMonthVoucher = vouchers?.find((v) => {
    const d = new Date(v.dueDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {thisMonthVoucher && <ThisMonthCard voucher={thisMonthVoucher} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6">
          <h3 className="font-heading text-lg font-bold text-neutral-900 mb-4">How to pay via JazzCash</h3>
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-pill bg-primary-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-neutral-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col">
          <h3 className="font-heading text-lg font-bold text-neutral-900 mb-4">Tutorial Video</h3>
          <div className="flex-1 min-h-[180px] rounded-lg bg-primary-900 flex items-center justify-center cursor-pointer group">
            <span className="w-14 h-14 rounded-pill bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <PlayIcon className="w-7 h-7" />
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-3">How to pay your fee via JazzCash — 2 min walkthrough</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-neutral-200">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Fee History</h3>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load fee history.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No fee vouchers yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="sm:hidden flex flex-col divide-y divide-neutral-100"
            >
              {vouchers.map((v) => (
                <motion.div key={v._id} variants={fadeInUp} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900">{v.month}</p>
                    <StatusPill status={v.status} />
                  </div>
                  <p className="text-sm text-neutral-700">
                    {formatAmount(v.amount)} <span className="text-neutral-400">· {v.type}</span>
                  </p>
                  <p className="text-xs text-neutral-500">Due {formatDate(v.dueDate)}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-mono text-neutral-600">{v.voucherId}</span>
                    <CopyVoucherButton voucherId={v.voucherId} />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Tablet/desktop: table, horizontally scrollable if the viewport is tight */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-50 border-b border-neutral-100">
                  <span className="w-24 shrink-0">Month</span>
                  <span className="w-24 shrink-0">Amount</span>
                  <span className="w-24 shrink-0">Type</span>
                  <span className="w-28 shrink-0">Due Date</span>
                  <span className="flex-1">Voucher ID</span>
                  <span className="w-20 shrink-0 text-right">Status</span>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {vouchers.map((v) => (
                  <motion.div
                    key={v._id}
                    variants={fadeInUp}
                    className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100 last:border-b-0 text-sm"
                  >
                    <span className="w-24 shrink-0 font-medium text-neutral-800">{v.month}</span>
                    <span className="w-24 shrink-0 text-neutral-600">{formatAmount(v.amount)}</span>
                    <span className="w-24 shrink-0 text-neutral-500">{v.type}</span>
                    <span className="w-28 shrink-0 text-neutral-500">{formatDate(v.dueDate)}</span>
                    <span className="flex-1 flex items-center gap-1.5 font-mono text-neutral-600">
                      {v.voucherId}
                      <CopyVoucherButton voucherId={v.voucherId} />
                    </span>
                    <span className="w-20 shrink-0 text-right">
                      <StatusPill status={v.status} />
                    </span>
                  </motion.div>
                ))}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
