import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getAttemptResult } from '../services/quizService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { CheckCircleIcon, XCircleIcon, WarningIcon, TrophyIcon } from '../components/icons';
import Confetti from '../components/Confetti';

const CONFETTI_DURATION_MS = 4200;

function QuestionReviewItem({ q, index }) {
  if (q.isCorrect) {
    return (
      <div className="flex items-start gap-2.5 py-3 border-b border-neutral-100 last:border-b-0">
        <CheckCircleIcon className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-500 mr-1.5">Q{index + 1}.</span>
          {q.questionText}
        </p>
      </div>
    );
  }

  const selectedText = q.selectedIndex !== null && q.selectedIndex !== undefined ? q.options[q.selectedIndex] : null;
  const correctText = q.options[q.correctOptionIndex];

  return (
    <div data-testid="wrong-question-review" className="py-4 border-b border-neutral-100 last:border-b-0 flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <XCircleIcon className="w-4 h-4 text-danger-text shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-neutral-900">
          <span className="font-semibold text-neutral-500 mr-1.5">Q{index + 1}.</span>
          {q.questionText}
        </p>
      </div>
      <div className="pl-6 flex flex-col gap-1 text-sm">
        <p className="text-danger-text">
          Your answer:{' '}
          {selectedText ? selectedText : <span className="italic text-neutral-400">Left blank</span>}
        </p>
        <p className="text-success-text">Correct answer: {correctText}</p>
      </div>
      <div className="ml-6 bg-info-bg text-info-text rounded-md px-3.5 py-2.5 text-sm">
        <span className="font-semibold">Why: </span>
        {q.explanation}
      </div>
    </div>
  );
}

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quiz', 'result', attemptId],
    queryFn: () => getAttemptResult(attemptId),
  });

  // Celebrate every time a passed result loads — including on revisits from
  // the quiz list, since results review is permanently accessible.
  useEffect(() => {
    if (!data || data.attempt.status !== 'passed') return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => clearTimeout(timer);
  }, [data]);

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load this result.</p>
          <button
            type="button"
            onClick={() => navigate('/quiz')}
            className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const { attempt, quiz } = data;
  const passed = attempt.status === 'passed';

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center px-4 py-10">
      {showConfetti && <Confetti />}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl flex flex-col gap-6"
      >
        {passed && (
          // Same navy/gold-foil "celebratory TITAN moment" family as the
          // Certificate card (radial glow + diagonal hairline pattern over
          // primary-900, gold border) — a smaller cousin of it, not a copy,
          // so a pass and a completed certificate visibly read as related.
          <motion.div
            variants={fadeInUp}
            data-testid="pass-celebration"
            className="w-full max-w-lg mx-auto rounded-xl shadow-card px-5 py-4 text-center bg-primary-900 border-2 border-accent-500 text-white relative overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 0%, rgba(206,164,92,0.28) 0%, rgba(206,164,92,0) 50%), repeating-linear-gradient(135deg, rgba(206,164,92,0.07) 0px, rgba(206,164,92,0.07) 1px, transparent 1px, transparent 13px)',
            }}
          >
            <p className="font-heading font-bold text-base sm:text-lg text-accent-400 flex items-center justify-center gap-2">
              <TrophyIcon className="w-5 h-5 shrink-0" />
              Great job! You passed {quiz.title}
            </p>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="w-full max-w-lg mx-auto bg-white border border-neutral-200 rounded-xl shadow-card p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{quiz.module}</p>
            <h1 className="font-heading text-xl font-bold text-neutral-900 mt-1">{quiz.title}</h1>
          </div>

          <div className="flex flex-col items-center gap-2 py-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-sm font-bold ${
                passed ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
              }`}
            >
              {passed ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
              {passed ? 'Passed' : 'Failed'}
            </span>
            <p className="font-heading text-4xl font-bold text-neutral-900 mt-2">{attempt.percentage}%</p>
            <p className="text-sm text-neutral-500">
              {attempt.score} / {attempt.totalMarks} marks
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-success-bg rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-success-text">{attempt.correctCount}</p>
              <p className="text-xs text-neutral-600 mt-0.5">Correct</p>
            </div>
            <div className="bg-danger-bg rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-danger-text">{attempt.incorrectCount}</p>
              <p className="text-xs text-neutral-600 mt-0.5">Incorrect</p>
            </div>
            <div className="bg-neutral-100 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-neutral-600">{attempt.unansweredCount}</p>
              <p className="text-xs text-neutral-600 mt-0.5">Unanswered</p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Integrity Report</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 flex items-center gap-2">
                <WarningIcon className="w-4 h-4 text-warning-text" />
                Tab switches
              </span>
              <span className="font-semibold text-neutral-800">{attempt.tabSwitchCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1.5">
              <span className="text-neutral-600 flex items-center gap-2">
                <WarningIcon className="w-4 h-4 text-warning-text" />
                Fullscreen exits
              </span>
              <span className="font-semibold text-neutral-800">{attempt.fullscreenExitCount}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">This is visible to your trainer along with your score.</p>
          </div>
        </motion.div>

        {quiz.questions?.length > 0 && (
          <motion.div variants={fadeInUp} className="bg-white border border-neutral-200 rounded-xl shadow-card p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-neutral-900">Question Review</h2>
            <p className="text-xs text-neutral-400 mt-0.5 mb-1">
              Explanations are shown below for anything you missed.
            </p>
            <div className="flex flex-col">
              {quiz.questions.map((q, i) => (
                <QuestionReviewItem key={i} q={q} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          variants={fadeInUp}
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/quiz')}
          className="rounded-md px-5 py-2.5 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 w-full max-w-lg mx-auto"
        >
          Back to Quizzes
        </motion.button>
      </motion.div>
    </div>
  );
}
