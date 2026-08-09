import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuizForTaking, startAttempt, submitAttempt } from '../services/quizService';
import Modal from '../components/Modal';
import { WarningIcon, LockIcon } from '../components/icons';

const VIOLATION_THRESHOLD = 5;
const DEBOUNCE_MS = 500;

function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function QuizTakingPage() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attemptMeta, setAttemptMeta] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [locked, setLocked] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submittingRef = useRef(false);
  const lastEventAtRef = useRef({ tabSwitch: 0, fullscreenExit: 0 });
  const answersRef = useRef([]);
  const countsRef = useRef({ tabSwitchCount: 0, fullscreenExitCount: 0 });
  const startedAtRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    countsRef.current = { tabSwitchCount, fullscreenExitCount };
  }, [tabSwitchCount, fullscreenExitCount]);

  // ---- Load quiz + start attempt ----
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [quizData, meta] = await Promise.all([getQuizForTaking(courseId, quizId), startAttempt(courseId, quizId)]);
        if (cancelled) return;
        setQuiz(quizData);
        setAttemptMeta(meta);
        setAnswers(new Array(quizData.questions.length).fill(null));
        setLocked(new Array(quizData.questions.length).fill(false));
        setTimeLeft(meta.durationMinutes * 60);
        startedAtRef.current = meta.startedAt;

        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // Fullscreen may be blocked outside a direct user gesture — the
          // quiz still works, exit/tab-switch detection still runs.
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [courseId, quizId]);

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (reason) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      if (reason) setAutoSubmitReason(reason);

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }

      try {
        const { attemptId } = await submitAttempt(courseId, quizId, {
          answers: answersRef.current,
          startedAt: startedAtRef.current,
          tabSwitchCount: countsRef.current.tabSwitchCount,
          fullscreenExitCount: countsRef.current.fullscreenExitCount,
        });
        navigate(`/quiz/${courseId}/result/${attemptId}`, { replace: true });
      } catch {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [courseId, quizId, navigate]
  );

  // ---- Countdown timer ----
  useEffect(() => {
    if (!attemptMeta) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit('timer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [attemptMeta, handleSubmit]);

  // ---- Integrity Mode: tab-switch / fullscreen-exit detection ----
  const recordViolation = useCallback(
    (type) => {
      if (submittingRef.current) return;
      const now = Date.now();
      if (now - lastEventAtRef.current[type] < DEBOUNCE_MS) return;
      lastEventAtRef.current[type] = now;

      setBannerVisible(true);
      if (type === 'tabSwitch') {
        setTabSwitchCount((c) => c + 1);
      } else {
        setFullscreenExitCount((c) => c + 1);
      }
    },
    []
  );

  useEffect(() => {
    if (tabSwitchCount + fullscreenExitCount > VIOLATION_THRESHOLD) {
      handleSubmit('integrity');
    }
  }, [tabSwitchCount, fullscreenExitCount, handleSubmit]);

  useEffect(() => {
    function onBlur() {
      recordViolation('tabSwitch');
    }
    function onVisibilityChange() {
      if (document.hidden) recordViolation('tabSwitch');
    }
    function onFullscreenChange() {
      if (!document.fullscreenElement) recordViolation('fullscreenExit');
    }

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [recordViolation]);

  // Leaving a question that has an answer selected locks it — the student
  // can still navigate back to review it (Previous or the dot strip), but
  // can no longer change what they picked.
  function goToQuestion(newIndex) {
    if (newIndex === currentIndex) return;
    setLocked((prev) => {
      if (prev[currentIndex] || answers[currentIndex] === null) return prev;
      const next = [...prev];
      next[currentIndex] = true;
      return next;
    });
    setCurrentIndex(newIndex);
  }

  function selectOption(optionIndex) {
    if (locked[currentIndex]) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-neutral-500">Couldn't load this quiz.</p>
          <button
            type="button"
            onClick={() => navigate(`/quiz/${courseId}`)}
            className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || !attemptMeta) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  const totalViolations = tabSwitchCount + fullscreenExitCount;
  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const unansweredCount = answers.filter((a) => a === null).length;
  const timerDanger = timeLeft <= 60;
  const isLocked = locked[currentIndex];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-primary-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-panel">
        <div className="min-w-0">
          <p className="font-heading font-bold text-sm sm:text-base truncate">{quiz.title}</p>
          <p className="text-white/50 text-xs truncate">{quiz.module}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={unansweredCount > 0}
            onClick={() => setConfirmOpen(true)}
            title={unansweredCount > 0 ? 'Answer every question before submitting' : undefined}
            className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-xs font-semibold border border-white/20 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Submit Quiz
          </button>
          <div
            data-testid="quiz-timer"
            className={`font-mono text-base sm:text-lg font-bold px-3 py-1.5 rounded-md tabular-nums ${
              timerDanger ? 'bg-danger-bg text-danger-text' : 'bg-white/10 text-accent-400'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {bannerVisible && (
        <div
          data-testid="integrity-banner"
          className="bg-warning-bg border-b border-accent-300 px-4 sm:px-6 py-3 flex items-center gap-2.5 text-warning-text text-sm font-semibold"
        >
          <WarningIcon className="w-5 h-5 shrink-0" />
          <span>
            Fullscreen exited / tab switch detected — this has been logged ({totalViolations})
          </span>
        </div>
      )}

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-neutral-600">
              Question {currentIndex + 1} of {quiz.questions.length}
            </p>
            <p className="text-xs text-neutral-400">{unansweredCount} unanswered</p>
          </div>
          <div className="h-2 rounded-pill bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-7 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-heading text-lg font-bold text-neutral-900">{question.questionText}</p>
            {isLocked && (
              <span
                data-testid="locked-badge"
                className="shrink-0 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold bg-neutral-100 text-neutral-500"
              >
                <LockIcon className="w-3.5 h-3.5" />
                Locked
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              const selected = answers[currentIndex] === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isLocked}
                  onClick={() => selectOption(i)}
                  className={`text-left rounded-lg border-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                    selected
                      ? 'border-accent-500 bg-accent-50 text-primary-900'
                      : `border-neutral-200 text-neutral-700 ${
                          isLocked ? 'opacity-50' : 'hover:border-neutral-300 hover:bg-neutral-50'
                        }`
                  } ${isLocked ? 'cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-pill border mr-2.5 text-[10px] font-bold align-middle ${
                      selected ? 'border-accent-500 bg-accent-500 text-white' : 'border-neutral-300 text-neutral-400'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              className="rounded-md px-4 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {isLast ? (
              <button
                type="button"
                disabled={unansweredCount > 0}
                onClick={() => setConfirmOpen(true)}
                className="rounded-md px-5 py-2 text-sm font-semibold bg-accent-500 text-primary-900 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-500"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                type="button"
                disabled={answers[currentIndex] === null}
                onClick={() => goToQuestion(Math.min(quiz.questions.length - 1, currentIndex + 1))}
                className="rounded-md px-5 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-800"
              >
                Next
              </button>
            )}
          </div>
          {!isLocked && answers[currentIndex] === null && (
            <p className="text-xs text-neutral-400 -mt-2">Select an answer to continue.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {quiz.questions.map((q, i) => {
            const answered = answers[i] !== null;
            const isCurrent = i === currentIndex;
            const isQLocked = locked[i];
            return (
              <button
                key={q._id}
                type="button"
                onClick={() => goToQuestion(i)}
                aria-label={`Go to question ${i + 1}${isQLocked ? ' (locked)' : ''}`}
                className={`w-8 h-8 rounded-pill text-xs font-semibold flex items-center justify-center transition-colors ${
                  isCurrent
                    ? `ring-2 ring-accent-500 ring-offset-1 ${isQLocked ? 'bg-primary-800 text-white' : 'bg-white text-primary-900'}`
                    : answered
                    ? 'bg-primary-800 text-white'
                    : 'border border-neutral-300 text-neutral-500 bg-white hover:bg-neutral-50'
                }`}
              >
                {isQLocked ? <LockIcon className="w-3.5 h-3.5" /> : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Quiz?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-md px-4 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Keep Reviewing
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setConfirmOpen(false);
                handleSubmit(null);
              }}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-accent-500 text-primary-900 hover:bg-accent-400 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          You've answered all {quiz.questions.length} questions.
        </p>
        <p className="text-sm text-neutral-600 mt-2">Once submitted, you cannot change your answers.</p>
      </Modal>

      {(submitting || autoSubmitReason) && (
        <div className="fixed inset-0 z-[60] bg-primary-900/90 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-modal p-6 max-w-sm text-center flex flex-col gap-2">
            <p className="font-heading font-bold text-neutral-900">
              {autoSubmitReason === 'timer' && "Time's up!"}
              {autoSubmitReason === 'integrity' && 'Quiz auto-submitted'}
              {!autoSubmitReason && 'Submitting your quiz...'}
            </p>
            <p className="text-sm text-neutral-500">
              {autoSubmitReason === 'timer' && 'Your quiz was submitted automatically because the timer reached zero.'}
              {autoSubmitReason === 'integrity' &&
                `Your quiz was submitted automatically after ${VIOLATION_THRESHOLD}+ tab-switch/fullscreen violations were logged.`}
              {!autoSubmitReason && 'Please wait a moment.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
