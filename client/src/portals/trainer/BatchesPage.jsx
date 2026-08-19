import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTrainerDashboard } from '../../services/trainerDashboardService';

// The source design (TITAN Trainer Portal.html) has no separate content
// for a "Batches" nav item — its Dashboard view is literally titled "My
// Batches" and shows this same batch-card grid. So this page reuses that
// exact layout/data (GET /api/trainer/dashboard via DashboardPage.jsx's
// query key, so the two pages share a react-query cache entry) rather
// than inventing a different one.
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

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

export default function BatchesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: getTrainerDashboard,
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

  if (batches.length === 0) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-body-sm text-neutral-400">
        No batches assigned to you yet.
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}
    </motion.div>
  );
}
