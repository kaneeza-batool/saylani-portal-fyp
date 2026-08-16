import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAttendanceSummary, getAttendanceByMonth } from '../services/attendanceService';
import { getProgress } from '../services/progressService';
import { fetchMyAttendanceRequests, selfMarkAttendance } from '../services/attendanceRequestService';
import { StatCard, StatCardSkeleton } from '../components/StatCard';
import { staggerContainer } from '../lib/motionVariants';
import { CertificateIcon } from '../components/icons';
import RequestCorrectionModal from '../components/RequestCorrectionModal';
import RequestAttendanceModal from '../components/RequestAttendanceModal';

const STATUS_STYLE = {
  present: 'bg-success-bg text-success-text',
  leave: 'bg-warning-bg text-warning-text',
  absent: 'bg-danger-bg text-danger-text',
};

const STATUS_LABEL = {
  present: 'Present',
  leave: 'Leave',
  absent: 'Absent',
};

function monthLabel(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function dateLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function attendanceMessage(percentage, isCourseComplete) {
  // A finished course reads in the past tense — "keep it up" doesn't make
  // sense once there's nothing left to keep attending.
  if (isCourseComplete) return { text: `Course completed with ${percentage}% attendance.`, tone: 'success', icon: CertificateIcon };
  if (percentage >= 85) return { text: 'Excellent attendance! Keep it up.', tone: 'success' };
  if (percentage >= 70) return { text: 'Your attendance is good, keep it up!', tone: 'success' };
  if (percentage >= 50) return { text: 'Your attendance needs improvement.', tone: 'warning' };
  return { text: 'Your attendance is critically low. Please contact your campus.', tone: 'danger' };
}

const REQUEST_STATUS_STYLE = {
  pending: 'bg-warning-bg text-warning-text',
  approved: 'bg-success-bg text-success-text',
  rejected: 'bg-danger-bg text-danger-text',
};
const REQUEST_STATUS_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

function CorrectionControl({ record, existingRequest, onRequest }) {
  if (existingRequest) {
    return (
      <span className={`text-xs font-semibold rounded-pill px-2.5 py-1 ${REQUEST_STATUS_STYLE[existingRequest.status]}`}>
        Correction {REQUEST_STATUS_LABEL[existingRequest.status]}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onRequest(record)}
      className="text-xs font-semibold text-primary-800 hover:text-primary-900 hover:underline"
    >
      Request correction
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 last:border-b-0 animate-pulse">
      <div className="h-4 w-28 bg-neutral-200 rounded" />
      <div className="h-6 w-20 bg-neutral-200 rounded-pill" />
    </div>
  );
}

// Self-service check-in for today — a plain one-tap check-in, no QR
// scanning (trainers are the source of truth for marking a class; this is
// only for a student to flag themselves present when the trainer hasn't
// marked yet). Request Instead is the fallback if that's wrong. If a
// record already exists (trainer marked the class, or you already checked
// in), this doesn't silently overwrite it — that's what Request Attendance
// is for.
function SelfMarkCard({ onOpenRequest }) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null); // { type: 'success' | 'already' | 'error', message }

  const mutation = useMutation({
    mutationFn: selfMarkAttendance,
    onSuccess: () => {
      setResult({ type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setResult({ type: 'already', status: err.response.data?.record?.status, message: err.response.data?.message });
      } else {
        setResult({ type: 'error', message: err.response?.data?.message || 'Something went wrong. Please try again.' });
      }
    },
  });

  const canAct = !result || result.type === 'error';

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-800 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 14l2 2 4-4" />
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18" />
            <path d="M8 2v4M16 2v4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">Mark My Attendance</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {result?.type === 'success'
              ? "You're marked present for today ✓"
              : result?.type === 'already'
                ? result.message
                : "Check in if your trainer hasn't marked today's class yet."}
          </p>
        </div>
      </div>

      {canAct && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-md px-4 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Checking in...' : 'Check In'}
          </button>
        </div>
      )}

      {result?.type !== 'success' && (
        <button
          type="button"
          onClick={onOpenRequest}
          className="self-start text-xs font-semibold text-primary-800 hover:text-primary-900 hover:underline"
        >
          Something wrong? Request attendance instead
        </button>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [correctionRecord, setCorrectionRecord] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const { data: myRequests } = useQuery({
    queryKey: ['attendance-requests'],
    queryFn: fetchMyAttendanceRequests,
  });
  const requestByRecordId = new Map((myRequests ?? []).map((r) => [String(r.attendanceRecord), r]));

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: () => getAttendanceSummary(),
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['attendance', 'monthly', selectedMonth],
    queryFn: () => getAttendanceByMonth(selectedMonth),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => getProgress(),
  });

  useEffect(() => {
    if (!selectedMonth && monthly?.month) setSelectedMonth(monthly.month);
  }, [monthly, selectedMonth]);

  const message = summary ? attendanceMessage(summary.percentage, progress?.overallPercentage === 100) : null;
  const bannerClass = {
    success: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    danger: 'bg-danger-bg text-danger-text',
  }[message?.tone] || '';

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SelfMarkCard onOpenRequest={() => setRequestModalOpen(true)} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {summaryLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Classes" value={summary.total} />
            <StatCard label="Present" value={summary.present} tone="success" />
            <StatCard label="Leave" value={summary.leave} tone="warning" />
            <StatCard label="Absent" value={summary.absent} tone="danger" />
          </>
        )}
      </motion.div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-6">
        {summaryLoading ? (
          <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-neutral-700">Overall Attendance</p>
              <p className="text-sm font-bold text-neutral-900">{summary.percentage}%</p>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-pill overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-pill transition-all"
                style={{ width: `${Math.min(summary.percentage, 100)}%` }}
              />
            </div>
            <p className={`inline-flex items-center gap-1.5 mt-3 text-sm font-medium rounded-md px-3 py-1.5 ${bannerClass}`}>
              {message.icon && <message.icon className="w-3.5 h-3.5 shrink-0" />}
              {message.text}
            </p>
          </>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-neutral-200">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Class History</h3>
          {monthly?.availableMonths?.length > 0 && (
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {monthly.availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Desktop/tablet table header — hidden on mobile in favor of stacked rows */}
        <div className="hidden sm:grid grid-cols-3 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-50 border-b border-neutral-100">
          <span>Date</span>
          <span className="text-center">Status</span>
          <span className="text-right">Correction</span>
        </div>

        {monthlyLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : monthly?.records?.length > 0 ? (
          monthly.records.map((record) => (
            <div key={record._id} className="border-b border-neutral-100 last:border-b-0">
              {/* Mobile: stacked card */}
              <div className="sm:hidden flex items-center justify-between px-4 py-3.5 gap-2">
                <p className="text-sm font-medium text-neutral-700">{dateLabel(record.date)}</p>
                <StatusPill status={record.status} />
                <CorrectionControl record={record} existingRequest={requestByRecordId.get(String(record._id))} onRequest={setCorrectionRecord} />
              </div>

              {/* Tablet/desktop: table row */}
              <div className="hidden sm:grid grid-cols-3 items-center px-5 py-4 text-sm">
                <span className="font-medium text-neutral-700">{dateLabel(record.date)}</span>
                <span className="flex justify-center">
                  <StatusPill status={record.status} />
                </span>
                <span className="flex justify-end">
                  <CorrectionControl record={record} existingRequest={requestByRecordId.get(String(record._id))} onRequest={setCorrectionRecord} />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No classes recorded for this month.</p>
          </div>
        )}
      </div>

      <RequestCorrectionModal open={!!correctionRecord} record={correctionRecord} onClose={() => setCorrectionRecord(null)} />
      <RequestAttendanceModal open={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
    </div>
  );
}
