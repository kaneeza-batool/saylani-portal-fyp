import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import CourseCard from '../../components/common/CourseCard';
import ScrollToTopButton from '../../components/common/ScrollToTopButton';
import useCourses from '../../hooks/useCourses';
import { QUESTIONS, getRecommendations, explainRecommendation } from '../../data/quizConfig';

/* ============================================================
   TITAN — Find Your Path Quiz (/find-your-path)
   Theme: TITAN Navy / Gold Brand Palette
   ============================================================ */

const EMPTY_ANSWERS = { interest: null, coding: null, duration: null, goal: null };

const ProgressBar = ({ step, total }) => (
  <div className="mb-10">
    <div className="flex items-center justify-between mb-2">
      <span className="te-mono text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
        Step {step + 1} of {total}
      </span>
      <span className="te-mono text-[11px] font-bold text-accent-600">{Math.round(((step + 1) / total) * 100)}%</span>
    </div>
    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full transition-all duration-500"
        style={{ width: `${((step + 1) / total) * 100}%` }}
      />
    </div>
  </div>
);

const QuestionStep = ({ question, selectedId, onSelect }) => (
  <div>
    <h2 className="te-display text-2xl sm:text-3xl font-bold text-neutral-900 leading-snug">{question.question}</h2>
    <p className="te-body text-sm text-neutral-500 mt-2">{question.subtitle}</p>

    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {question.options.map((option) => {
        const selected = selectedId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selected
                ? 'border-primary-900 bg-primary-900 text-white shadow-md'
                : 'border-neutral-200 bg-white text-neutral-900 hover:border-primary-300 hover:bg-neutral-50/60'
            }`}
          >
            <span className="text-xl shrink-0">{option.icon}</span>
            <span className="te-body text-sm font-semibold">{option.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const ResultsScreen = ({ answers, onRetake, courses }) => {
  const recommendations = getRecommendations(courses, answers, 2);
  const [top, runnerUp] = recommendations;

  return (
    <div>
      <div className="text-center mb-10">
        <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-accent-700 bg-accent-50 border border-accent-200 rounded-full">
          Your Results
        </Badge>
        <h2 className="te-display text-3xl sm:text-4xl font-bold text-neutral-900 mt-5">Your Recommended Path</h2>
      </div>

      {/* Top Match */}
      <div className="mb-4">
        <Card className="p-5 bg-accent-50/60 border border-accent-200 rounded-xl mb-5">
          <p className="te-mono text-[10px] font-bold text-accent-700 uppercase tracking-wider mb-1.5">Why This Fits You</p>
          <p className="te-body text-sm text-neutral-700 leading-relaxed">{explainRecommendation(top.track, answers)}</p>
        </Card>
        <div className="max-w-md mx-auto">
          <CourseCard track={top.track} />
        </div>
      </div>

      {/* Runner Up */}
      {runnerUp && (
        <div className="mt-14">
          <p className="te-mono text-xs font-bold text-neutral-400 uppercase tracking-widest text-center mb-5">You Might Also Like</p>
          <div className="max-w-md mx-auto">
            <CourseCard track={runnerUp.track} />
          </div>
        </div>
      )}

      <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/programs" className="text-sm font-bold text-neutral-600 hover:text-neutral-900 no-underline transition-colors">
          See All Programs →
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="px-6 py-3 border border-neutral-200 text-neutral-900 font-bold text-sm rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          Retake Quiz
        </button>
      </div>
    </div>
  );
};

const FindYourPath = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const { courses, loading: coursesLoading } = useCourses();

  const isResults = step === QUESTIONS.length;
  const currentQuestion = !isResults ? QUESTIONS[step] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  const handleSelect = (optionId) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = () => {
    if (currentAnswer == null) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleRetake = () => {
    setAnswers(EMPTY_ANSWERS);
    setStep(0);
  };

  return (
    <div className="relative bg-neutral-50 antialiased selection:bg-accent-500/20 pt-16 min-h-[80vh]">
      <section className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-neutral-50/30 border-b border-neutral-100">
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
             style={{ backgroundImage: 'radial-gradient(#E4E1DA 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="te-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 text-accent-700 bg-accent-50 border border-accent-200 rounded-full">
            Find Your Path
          </Badge>
          <h1 className="te-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary-900 leading-[1.15] mt-6">
            Not Sure Which Program Fits? <br />
            <span className="bg-gradient-to-r from-accent-600 via-accent-400 to-accent-700 bg-clip-text text-transparent">
              Take The 2-Minute Quiz.
            </span>
          </h1>
          <p className="te-body mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-xl mx-auto font-normal">
            Answer four quick questions and we'll match you to a TITAN program based on your interests, experience, and goals.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 sm:p-10 bg-white border border-neutral-100 rounded-2xl shadow-sm">
            {!isResults ? (
              <>
                <ProgressBar step={step} total={QUESTIONS.length} />
                <QuestionStep question={currentQuestion} selectedId={currentAnswer} onSelect={handleSelect} />

                <div className="mt-10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 0}
                    className={`px-5 py-2.5 font-bold text-sm rounded-lg transition-colors ${
                      step === 0
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-700 hover:bg-neutral-50 cursor-pointer'
                    }`}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentAnswer == null}
                    className={`px-7 py-3 font-bold text-sm rounded-lg transition-all shadow-md ${
                      currentAnswer == null
                        ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed shadow-none'
                        : 'bg-primary-900 text-white hover:bg-primary-800 shadow-primary-900/15 cursor-pointer'
                    }`}
                  >
                    {step === QUESTIONS.length - 1 ? 'See My Results →' : 'Next →'}
                  </button>
                </div>
              </>
            ) : coursesLoading ? (
              <p className="text-center text-sm text-neutral-500 py-10">Finding your best-fit programs...</p>
            ) : (
              <ResultsScreen answers={answers} onRetake={handleRetake} courses={courses} />
            )}
          </Card>
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
};

export default FindYourPath;
