import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getQuizzes } from '../services/quizService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { WarningIcon, InfoIcon, ClockIcon } from '../components/icons';

const IMPORTANT_INFO = [
  'Once started, a quiz must be completed in one session — you cannot pause and resume later.',
  'Switching tabs or exiting fullscreen during a quiz is recorded and shown to your trainer.',
  'Make sure you have a stable internet connection before starting.',
  'Quizzes run in fullscreen mode for a distraction-free, proctored experience.',
];

const STATUS_STYLE = {
  passed: 'bg-success-bg text-success-text',
  failed: 'bg-danger-bg text-danger-text',
};

function StatusPill({ status }) {
  if (!status) {
    return <span className="inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold bg-neutral-100 text-neutral-500">Not Attempted</span>;
  }
  return (
    <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {status === 'passed' ? 'Passed' : 'Failed'}
    </span>
  );
}

function InfoTooltip({ quiz }) {
  return (
    <span className="relative inline-flex group">
      <InfoIcon className="w-4 h-4 text-neutral-400 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-neutral-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
        <ClockIcon className="w-3.5 h-3.5" />
        {quiz.durationMinutes} min · Pass at 70%
      </span>
    </span>
  );
}

function ActionCell({ quiz, onStart, onReview }) {
  if (quiz.attempts > 0) {
    return (
      <button
        type="button"
        onClick={() => onReview(quiz.lastAttemptId)}
        className="inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
      >
        Completed
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onStart(quiz._id)}
      className="rounded-md px-4 py-1.5 text-sm font-semibold bg-accent-500 text-primary-900 hover:bg-accent-400 transition-colors"
    >
      Start
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 last:border-b-0 animate-pulse">
      <div className="h-4 w-32 bg-neutral-200 rounded" />
      <div className="h-6 w-20 bg-neutral-200 rounded-pill" />
    </div>
  );
}

export default function QuizListPage() {
  const navigate = useNavigate();

  const {
    data: quizzes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['quiz', 'list'],
    queryFn: () => getQuizzes(),
  });

  function handleStart(quizId) {
    navigate(`/quiz/take/${quizId}`);
  }

  function handleReview(attemptId) {
    navigate(`/quiz/result/${attemptId}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-warning-bg border border-accent-300/50 rounded-lg p-4 sm:p-5 flex gap-3">
        <WarningIcon className="w-5 h-5 text-warning-text shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-warning-text mb-1.5">Important Information</p>
          <ul className="flex flex-col gap-1">
            {IMPORTANT_INFO.map((line) => (
              <li key={line} className="text-sm text-neutral-700 flex gap-2">
                <span className="text-warning-text">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200">
          <h3 className="font-heading text-lg font-bold text-neutral-900">Quizzes</h3>
        </div>

        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load quizzes.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">No quizzes yet.</p>
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
              {quizzes.map((q) => (
                <motion.div key={q._id} variants={fadeInUp} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{q.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{q.module}</p>
                    </div>
                    <InfoTooltip quiz={q} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span>{q.questionCount} Questions</span>
                    <span>·</span>
                    <span>{q.attempts} {q.attempts === 1 ? 'Attempt' : 'Attempts'}</span>
                  </div>
                  {q.attempts > 0 && (
                    <p className="text-sm text-neutral-700">
                      Score: <span className="font-semibold">{q.score}/{q.totalMarks}</span>{' '}
                      <span className="text-neutral-400">({q.percentage}%)</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <StatusPill status={q.status} />
                    <ActionCell quiz={q} onStart={handleStart} onReview={handleReview} />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Tablet/desktop: table, horizontally scrollable if the viewport is tight.
                Title uses an explicit min-width (not just flex-1) — flex-1 combined
                with truncate's overflow:hidden lets the browser's min-width:auto
                collapse it to 0 when space is tight, silently hiding the text. */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[660px]">
                <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 bg-neutral-50 border-b border-neutral-100">
                  <span className="w-28 shrink-0">Module</span>
                  <span className="flex-1 min-w-[110px]">Title</span>
                  <span className="w-28 shrink-0 text-center">Questions</span>
                  <span className="w-28 shrink-0 text-center">Score</span>
                  <span className="w-24 shrink-0">Status</span>
                  <span className="w-20 shrink-0 text-right">Action</span>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {quizzes.map((q) => (
                  <motion.div
                    key={q._id}
                    variants={fadeInUp}
                    className="flex items-center gap-2 px-4 py-4 border-b border-neutral-100 last:border-b-0 text-sm"
                  >
                    <span className="w-28 shrink-0 text-neutral-500 truncate">{q.module}</span>
                    <span className="flex-1 min-w-[110px] flex items-center gap-1.5">
                      <span className="font-medium text-neutral-800 truncate min-w-0">{q.title}</span>
                      <InfoTooltip quiz={q} />
                    </span>
                    <span className="w-28 shrink-0 text-center text-neutral-600">
                      {q.questionCount} Q · {q.attempts}x
                    </span>
                    <span className="w-28 shrink-0 text-center text-neutral-600">
                      {q.attempts > 0 ? `${q.score}/${q.totalMarks} (${q.percentage}%)` : '—'}
                    </span>
                    <span className="w-24 shrink-0">
                      <StatusPill status={q.status} />
                    </span>
                    <span className="w-20 shrink-0 flex justify-end">
                      <ActionCell quiz={q} onStart={handleStart} onReview={handleReview} />
                    </span>
                  </motion.div>
                ))}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Having trouble with a quiz? Reach out to your trainer during class hours for help.
      </p>
    </div>
  );
}
