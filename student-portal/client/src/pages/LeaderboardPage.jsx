import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getFullLeaderboard } from '../services/leaderboardService';
import { initialsOf } from '../components/Sidebar';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { TrophyIcon, CrownIcon, MedalIcon } from '../components/icons';

// Rank 1/2/3 share the same custom-icon family (Crown for the top spot,
// Medal for 2nd/3rd) instead of medal emoji — tiered by the existing accent
// shades rather than new gold/silver/bronze colors, so it stays within the
// established token set.
function RankBadge({ rank }) {
  const tierBg = rank === 1 ? 'bg-accent-500' : rank === 2 ? 'bg-accent-400' : rank === 3 ? 'bg-accent-300' : 'bg-neutral-100';
  const tierText = rank <= 3 ? 'text-primary-900' : 'text-neutral-600';
  return (
    <span className={`w-8 h-8 shrink-0 rounded-pill flex items-center justify-center text-sm font-bold ${tierBg} ${tierText}`}>
      {rank === 1 ? (
        <CrownIcon className="w-[18px] h-[18px]" />
      ) : rank <= 3 ? (
        <MedalIcon className="w-[18px] h-[18px]" />
      ) : (
        rank
      )}
    </span>
  );
}

function Avatar({ student }) {
  return student.avatarUrl ? (
    <img src={student.avatarUrl} alt={student.fullName} className="w-9 h-9 rounded-pill object-cover shrink-0" />
  ) : (
    <span className="w-9 h-9 shrink-0 rounded-pill bg-primary-800 text-white font-bold text-xs flex items-center justify-center">
      {initialsOf(student.fullName)}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-pill bg-neutral-200 shrink-0" />
      <div className="w-9 h-9 rounded-pill bg-neutral-200 shrink-0" />
      <div className="flex-1 h-4 bg-neutral-200 rounded" />
      <div className="w-14 h-4 bg-neutral-200 rounded" />
    </div>
  );
}

export default function LeaderboardPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['leaderboard', 'full'],
    queryFn: () => getFullLeaderboard(),
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:text-primary-900 transition-colors self-start"
      >
        ← Back to Dashboard
      </Link>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-accent-500" />
            <h3 className="font-heading text-lg font-bold text-neutral-900">Batch Leaderboard</h3>
          </div>
          {!isLoading && !isError && (
            <span className="text-xs text-neutral-400 shrink-0">{data.students.length} students</span>
          )}
        </div>

        {/* Column header — desktop/tablet only */}
        <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-50 border-b border-neutral-100">
          <span className="w-8 shrink-0">Rank</span>
          <span className="w-9 shrink-0" />
          <span className="flex-1">Student</span>
          <span className="w-20 text-right shrink-0">Attendance</span>
          <span className="w-20 text-right shrink-0">Quiz Avg</span>
          <span className="w-16 text-right shrink-0">Score</span>
        </div>

        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load the leaderboard.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col divide-y divide-neutral-100"
          >
            {data.students.map((s) => {
              const isYou = s.studentId === data.you;
              return (
                <motion.div
                  key={s.studentId}
                  variants={fadeInUp}
                  className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 ${isYou ? 'bg-accent-500/10' : ''}`}
                >
                  <RankBadge rank={s.rank} />
                  <Avatar student={s} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold flex items-center flex-wrap gap-1.5 ${
                        isYou ? 'text-primary-800' : 'text-neutral-900'
                      }`}
                    >
                      <span className="truncate min-w-0">{s.fullName}</span>
                      {isYou && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-accent-700 bg-accent-500/20 rounded-pill px-1.5 py-0.5">
                          You
                        </span>
                      )}
                      {s.rank === 1 && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary-900 bg-accent-500 rounded-pill px-1.5 py-0.5 inline-flex items-center gap-1">
                          <CrownIcon className="w-3 h-3" />
                          Champion of the Week
                        </span>
                      )}
                    </p>
                    {/* Mobile: attendance/quiz shown inline since the column header is hidden */}
                    <p className="sm:hidden text-xs text-neutral-500 mt-0.5">
                      {s.attendancePercentage}% attendance · {s.quizAverage}% quiz avg
                    </p>
                  </div>
                  <span className="hidden sm:block w-20 text-right shrink-0 text-sm text-neutral-500">
                    {s.attendancePercentage}%
                  </span>
                  <span className="hidden sm:block w-20 text-right shrink-0 text-sm text-neutral-500">
                    {s.quizAverage}%
                  </span>
                  <span className="w-14 sm:w-16 shrink-0 text-right font-bold text-neutral-900">
                    {s.combinedScore}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
