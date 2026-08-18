import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrainerDashboard, getPendingReviewCount } from '../../services/trainerDashboardService';
import { useAuth } from '../../context/AuthContext';
import { BookIcon, GraduationCapIcon, ClipboardIcon } from '../../components/icons';

// Layout sourced from the "MY BATCHES DASHBOARD" section of TITAN Trainer
// Portal.html — a 2-col grid of batch cards, each with a progress ring and
// two quick actions. Backed by GET /api/trainer/dashboard, which reads the
// logged-in trainer's assigned Slot documents (Slot.assignedTrainer).
// `pct` is the batch's average real course progress (quiz-attempted % +
// assignment-submitted %, same formula students see on their own Student
// Portal — see server/utils/courseProgress.js), not seat-fill — seat-fill
// is already shown separately as the "X / Y students" line on the same
// card, so this ring used to just duplicate that instead of showing
// anything about actual learning progress.
//
// The welcome line + stat cards above the grid are derived entirely from
// that same batches array (no extra API call) — see buildSummary() below.
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

function TrendUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function buildSummary(batches, pendingReviewCount) {
  const totalBatches = batches.length;
  const totalStudents = batches.reduce((sum, b) => sum + (b.students || 0), 0);
  const avgProgress = totalBatches ? Math.round(batches.reduce((sum, b) => sum + (b.pct || 0), 0) / totalBatches) : 0;

  return [
    { id: 'batches', label: 'Total Batches', value: totalBatches, bg: 'bg-info-bg', color: 'text-info-text', Icon: BookIcon },
    { id: 'students', label: 'Total Students', value: totalStudents, bg: 'bg-success-bg', color: 'text-success-text', Icon: GraduationCapIcon },
    { id: 'progress', label: 'Average Progress', value: `${avgProgress}%`, bg: 'bg-warning-bg', color: 'text-warning-text', Icon: TrendUpIcon },
    {
      id: 'pending-reviews',
      label: 'Pending Reviews',
      value: pendingReviewCount ?? 0,
      bg: (pendingReviewCount ?? 0) > 0 ? 'bg-danger-50' : 'bg-neutral-100',
      color: (pendingReviewCount ?? 0) > 0 ? 'text-danger-600' : 'text-neutral-500',
      Icon: ClipboardIcon,
      linkTo: '/trainer/quizzes',
    },
  ];
}

function StatCard({ stat }) {
  const Icon = stat.Icon;
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase text-neutral-500">{stat.label}</span>
        <div className={`w-[34px] h-[34px] rounded flex items-center justify-center ${stat.bg} ${stat.color}`}>
          <Icon width="17" height="17" />
        </div>
      </div>
      <div className="font-heading text-h3 text-neutral-900">{stat.value}</div>
    </>
  );
  const className = 'bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3';

  if (stat.linkTo) {
    return (
      <motion.div variants={fadeInUp}>
        <Link to={stat.linkTo} className={`${className} block transition-colors hover:border-[var(--trainer-blue)]`}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp} className={className}>
      {content}
    </motion.div>
  );
}

function ProgressRing({ pct }) {
  const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div className="relative w-[52px] h-[52px] shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={RING_RADIUS} fill="none" className="stroke-neutral-100" strokeWidth="6" />
        <circle
          cx="26"
          cy="26"
          r={RING_RADIUS}
          fill="none"
          className="stroke-[var(--trainer-blue)]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-neutral-900">{pct}%</div>
    </div>
  );
}

function BatchCard({ batch }) {
  const navigate = useNavigate();

  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">{batch.course}</div>
          <div className="text-caption text-neutral-400 font-normal mt-0.5">
            {batch.campus} · {batch.schedule}
          </div>
        </div>
        <ProgressRing pct={batch.pct} />
      </div>

      <div className="flex items-center gap-1.5 text-body-sm text-neutral-600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3" />
          <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
        {batch.students} / {batch.seatsTotal} students
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/trainer/attendance')}
          className="flex-1 border-none bg-[var(--trainer-blue)] text-white text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:brightness-90"
        >
          Mark Attendance
        </button>
        <button
          type="button"
          onClick={() => navigate('/trainer/quizzes')}
          className="flex-1 border border-neutral-300 bg-surface text-neutral-900 text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:bg-neutral-100 hover:border-neutral-400"
        >
          Create Quiz
        </button>
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
          <div className="h-3 w-40 bg-neutral-100 rounded animate-pulse" />
        </div>
        <div className="w-[52px] h-[52px] rounded-full bg-neutral-100 animate-pulse" />
      </div>
      <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
      <div className="flex gap-2.5">
        <div className="flex-1 h-[34px] bg-neutral-100 rounded animate-pulse" />
        <div className="flex-1 h-[34px] bg-neutral-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: getTrainerDashboard,
  });
  const { data: pendingReviewCount } = useQuery({
    queryKey: ['trainer-pending-review-count'],
    queryFn: getPendingReviewCount,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3 items-start">
        <div className="text-body-sm text-danger-600">Couldn't load your batches. Please try again.</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="border-none bg-[var(--trainer-blue)] text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:brightness-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const batches = data?.batches ?? [];

  // Stats (including Pending Reviews) always show, even with zero batches
  // assigned — a trainer can have assignments/submissions to review
  // independent of whether Super Admin has linked any Slot to them yet.
  const summary = buildSummary(batches, pendingReviewCount);
  const recentBatches = batches.slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      <div className="font-heading font-bold text-h5 text-neutral-900">Welcome back, {user?.name}</div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summary.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </motion.div>

      {batches.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-body-sm text-neutral-400">
          No batches assigned to you yet.
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h6 text-neutral-900">Recent Batches</div>
        <Link
          to="/trainer/batches"
          className="text-caption font-semibold text-[var(--trainer-blue)] border border-neutral-300 rounded px-3 py-1.5 transition-colors hover:bg-neutral-100 hover:border-neutral-400"
        >
          View All Batches
        </Link>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recentBatches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
      </motion.div>
        </>
      )}
    </div>
  );
}
