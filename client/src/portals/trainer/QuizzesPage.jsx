import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { inputClass, labelClass } from './formFieldStyles';
import {
  getTrainerCourses,
  getMyQuizzes,
  createQuiz,
  getMyAssignments,
  createAssignment,
  getPendingSubmissions,
  getReviewedSubmissions,
  getPendingReviewCount,
  reviewSubmission,
} from '../../services/trainerDashboardService';

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

function CourseSelect({ courses, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} bg-surface`}>
      {!courses?.length && <option value="">Loading courses…</option>}
      {courses?.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Quiz Builder — unchanged from before, just extracted into its own tab.
// ---------------------------------------------------------------------------
function emptyQuestion(id) {
  return {
    id,
    marks: 5,
    text: '',
    explanation: '',
    options: [0, 1, 2, 3].map((n) => ({ id: id + n + 1, text: '', correct: n === 0 })),
  };
}

function QuestionCard({ question, index, onChangeMarks, onChangeText, onChangeExplanation, onChangeOptionText, onSetCorrect, onRemove, removable }) {
  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[18px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-neutral-400">Question {index + 1}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-neutral-600">Marks:</span>
            <input
              type="number"
              min="0"
              value={question.marks}
              onChange={(e) => onChangeMarks(question.id, e.target.value)}
              className="w-[52px] border border-neutral-200 rounded px-1.5 py-1 text-[12.5px] font-sans outline-none focus:border-[var(--trainer-blue)] transition-colors"
            />
          </div>
          {removable && (
            <button
              type="button"
              onClick={() => onRemove(question.id)}
              className="border-none bg-transparent text-danger-600 text-[12px] font-semibold cursor-pointer hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={question.text}
        onChange={(e) => onChangeText(question.id, e.target.value)}
        placeholder="Question text"
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-2.5">
        {question.options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-2 rounded px-3 py-[9px] border cursor-pointer transition-colors ${
              opt.correct ? 'border-success-text bg-success-bg' : 'border-neutral-200 bg-surface'
            }`}
          >
            <input
              type="radio"
              name={`q-${question.id}-correct`}
              checked={opt.correct}
              onChange={() => onSetCorrect(question.id, opt.id)}
              className="accent-[var(--trainer-blue)]"
            />
            <input
              type="text"
              value={opt.text}
              onChange={(e) => onChangeOptionText(question.id, opt.id, e.target.value)}
              placeholder="Option text"
              className={`flex-1 min-w-0 border-none bg-transparent outline-none text-body-sm font-sans ${
                opt.correct ? 'text-success-text' : 'text-neutral-900'
              }`}
            />
          </label>
        ))}
      </div>

      <textarea
        value={question.explanation}
        onChange={(e) => onChangeExplanation(question.id, e.target.value)}
        placeholder="Explanation — shown to the student after they submit, once they see whether they got it right"
        rows={2}
        className={`${inputClass} resize-none`}
      />
    </motion.div>
  );
}

function QuizBuilderTab({ courses }) {
  const queryClient = useQueryClient();
  const { data: myQuizzes } = useQuery({ queryKey: ['trainer-quizzes'], queryFn: getMyQuizzes });

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('');
  const [course, setCourse] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([emptyQuestion(1)]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!course && courses?.length) setCourse(courses[0].name);
  }, [courses, course]);

  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0), [questions]);

  const saveMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-quizzes'] });
      setTitle('');
      setModule('');
      setQuestions([emptyQuestion(Date.now())]);
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to save quiz. Please try again.'),
  });

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion(Date.now())]);
  const removeQuestion = (id) => setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev));
  const updateQuestion = (id, patch) => setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const updateOption = (qid, oid, patch) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) } : q))
    );
  const setCorrectOption = (qid, oid) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.map((o) => ({ ...o, correct: o.id === oid })) } : q))
    );

  const handleSave = () => {
    setFormError('');
    if (!title.trim() || !module.trim() || !course) {
      setFormError('Title, module, and course are all required.');
      return;
    }
    saveMutation.mutate({
      course,
      module: module.trim(),
      title: title.trim(),
      durationMinutes: Number(duration) || 0,
      questions: questions.map((q) => ({
        questionText: q.text,
        options: q.options.map((o) => o.text),
        correctOptionIndex: q.options.findIndex((o) => o.correct),
        marks: Number(q.marks) || 1,
        explanation: q.explanation,
      })),
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4 max-w-[760px]">
        <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Quiz Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HTML & CSS Basics" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Module</label>
              <input type="text" value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. Module 1: Basics" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Course</label>
              <CourseSelect courses={courses} value={course} onChange={setCourse} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Duration (min)</label>
              <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Total Marks</label>
              <div className="border border-neutral-200 bg-neutral-50 rounded px-3 py-[10px] text-body-sm font-semibold text-neutral-600">
                {totalMarks} (auto)
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="font-heading font-bold text-h6 text-neutral-900">
          Questions
        </motion.div>

        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            removable={questions.length > 1}
            onChangeMarks={(id, marks) => updateQuestion(id, { marks })}
            onChangeText={(id, text) => updateQuestion(id, { text })}
            onChangeExplanation={(id, explanation) => updateQuestion(id, { explanation })}
            onChangeOptionText={(qid, oid, text) => updateOption(qid, oid, { text })}
            onSetCorrect={setCorrectOption}
            onRemove={removeQuestion}
          />
        ))}

        <motion.button
          variants={fadeInUp}
          type="button"
          onClick={addQuestion}
          className="border-2 border-dashed border-neutral-300 rounded-xl py-[22px] text-center text-body-sm font-semibold text-neutral-400 cursor-pointer transition-colors hover:border-[var(--trainer-blue)] hover:text-[var(--trainer-blue)]"
        >
          + Add Question
        </motion.button>

        {formError && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{formError}</div>}

        <motion.button
          variants={fadeInUp}
          type="button"
          disabled={saveMutation.isPending}
          onClick={handleSave}
          className="self-start border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-5 py-[11px] rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
        </motion.button>
      </motion.div>

      <div className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
        <div className="font-heading font-bold text-h6 text-neutral-900">Your Quizzes</div>
        {!myQuizzes?.length ? (
          <div className="text-body-sm text-neutral-400">No quizzes created yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myQuizzes.map((q) => (
              <div key={q._id} className="border border-neutral-100 rounded-lg p-3 flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-neutral-900">{q.title}</span>
                <span className="text-caption text-neutral-500">{q.course} · {q.module}</span>
                <span className="text-caption text-neutral-400">
                  {q.questions?.length ?? 0} question{(q.questions?.length ?? 0) === 1 ? '' : 's'} · {q.totalMarks} marks · {q.durationMinutes} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignments — create an assignment; students submit through Student
// Portal's existing (already-built) assignment flow, nothing new needed
// there. Reference links are a textarea, one URL per line — matches
// Assignment.referenceLinks being a plain string array, no per-link add/
// remove UI needed for a v1.
// ---------------------------------------------------------------------------
function AssignmentsTab({ courses }) {
  const queryClient = useQueryClient();
  const { data: myAssignments } = useQuery({ queryKey: ['trainer-assignments'], queryFn: getMyAssignments });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isHackathon, setIsHackathon] = useState(false);
  const [referenceLinksText, setReferenceLinksText] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!course && courses?.length) setCourse(courses[0].name);
  }, [courses, course]);

  const saveMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments'] });
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsHackathon(false);
      setReferenceLinksText('');
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to save assignment. Please try again.'),
  });

  const handleSave = () => {
    setFormError('');
    if (!title.trim() || !description.trim() || !course || !dueDate) {
      setFormError('Title, description, course, and due date are all required.');
      return;
    }
    saveMutation.mutate({
      course,
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      isHackathon,
      referenceLinks: referenceLinksText.split('\n').map((l) => l.trim()).filter(Boolean),
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4 max-w-[760px]">
        <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Assignment Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a Portfolio Site" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What the student needs to do, and how it'll be evaluated"
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Course</label>
              <CourseSelect courses={courses} value={course} onChange={setCourse} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Reference Links (one per line, optional)</label>
            <textarea
              value={referenceLinksText}
              onChange={(e) => setReferenceLinksText(e.target.value)}
              placeholder="https://..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2 text-body-sm text-neutral-700 cursor-pointer w-fit">
            <input type="checkbox" checked={isHackathon} onChange={(e) => setIsHackathon(e.target.checked)} className="accent-[var(--trainer-blue)]" />
            This is a hackathon-style assignment
          </label>
        </motion.div>

        {formError && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{formError}</div>}

        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={handleSave}
          className="self-start border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-5 py-[11px] rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Assignment'}
        </button>
      </motion.div>

      <div className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3.5">
        <div className="font-heading font-bold text-h6 text-neutral-900">Your Assignments</div>
        {!myAssignments?.length ? (
          <div className="text-body-sm text-neutral-400">No assignments created yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myAssignments.map((a) => (
              <div key={a._id} className="border border-neutral-100 rounded-lg p-3 flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-neutral-900">{a.title}</span>
                <span className="text-caption text-neutral-500">{a.course}{a.isHackathon ? ' · Hackathon' : ''}</span>
                <span className="text-caption text-neutral-400">Due {new Date(a.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Submissions — the feature actually asked for: approve/reject a
// student's assignment submission, with a grade and remarks, which emails
// the student (see trainerAssignmentController.reviewSubmission).
// ---------------------------------------------------------------------------
function ReviewCard({ submission, onReview, isPending }) {
  const [grade, setGrade] = useState(submission.grade || '');
  const [remarks, setRemarks] = useState(submission.trainerRemarks || '');
  const isDecided = submission.status === 'approved' || submission.status === 'not_approved';

  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[18px] flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-body-sm font-semibold text-neutral-900">{submission.student?.name}</span>
          <span className="text-caption text-neutral-500">{submission.assignment?.title}</span>
          <span className="text-caption text-neutral-400">
            Submitted {new Date(submission.submittedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {submission.status === 'late_submitted' && <span className="text-warning-text font-semibold"> · Late</span>}
          </span>
        </div>
        {isDecided && (
          <span
            className={`text-badge px-2.5 py-1 rounded-pill w-fit ${
              submission.status === 'approved' ? 'bg-success-bg text-success-text' : 'bg-danger-50 text-danger-600'
            }`}
          >
            {submission.status === 'approved' ? 'Approved' : 'Needs Revision'}
          </span>
        )}
      </div>

      <p className="text-body-sm text-neutral-700 whitespace-pre-line">{submission.submissionText}</p>

      {submission.submissionLink && (
        <a
          href={submission.submissionLink}
          target="_blank"
          rel="noreferrer"
          className="text-caption font-semibold text-[var(--trainer-blue)] hover:underline w-fit"
        >
          View submission link →
        </a>
      )}

      {!isDecided ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Grade (optional)</label>
              <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. A, 85/100" className={inputClass} />
            </div>
          </div>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Remarks for the student (sent with the decision email)"
            rows={2}
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onReview(submission._id, 'approved', grade, remarks)}
              className="border-none bg-success-text text-white text-caption font-semibold px-4 py-2 rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onReview(submission._id, 'not_approved', grade, remarks)}
              className="border border-danger-200 bg-surface text-danger-600 text-caption font-semibold px-4 py-2 rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-50"
            >
              Needs Revision
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1 bg-neutral-50 rounded-lg p-3">
          {submission.grade && <span className="text-caption text-neutral-700"><b>Grade:</b> {submission.grade}</span>}
          {submission.trainerRemarks && <span className="text-caption text-neutral-700"><b>Remarks:</b> {submission.trainerRemarks}</span>}
        </div>
      )}
    </motion.div>
  );
}

function ReviewSubmissionsTab() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState('pending');
  const { data: pending } = useQuery({ queryKey: ['trainer-submissions-pending'], queryFn: getPendingSubmissions });
  const { data: reviewed } = useQuery({ queryKey: ['trainer-submissions-reviewed'], queryFn: getReviewedSubmissions, enabled: subTab === 'reviewed' });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, grade, trainerRemarks }) => reviewSubmission(id, { decision, grade, trainerRemarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-submissions-pending'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-submissions-reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-pending-review-count'] });
    },
  });

  const handleReview = (id, decision, grade, trainerRemarks) => reviewMutation.mutate({ id, decision, grade, trainerRemarks });

  const list = subTab === 'pending' ? pending : reviewed;

  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSubTab('pending')}
          className={`text-caption font-semibold px-3.5 py-2 rounded-pill cursor-pointer transition-colors ${
            subTab === 'pending' ? 'bg-[var(--trainer-blue)] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Pending{pending?.length ? ` (${pending.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('reviewed')}
          className={`text-caption font-semibold px-3.5 py-2 rounded-pill cursor-pointer transition-colors ${
            subTab === 'reviewed' ? 'bg-[var(--trainer-blue)] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Reviewed
        </button>
      </div>

      {!list?.length ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-center text-body-sm text-neutral-400">
          {subTab === 'pending' ? 'No submissions waiting for review.' : 'No reviewed submissions yet.'}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
          {list.map((s) => (
            <ReviewCard key={s._id} submission={s} onReview={handleReview} isPending={reviewMutation.isPending} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-level tab switcher
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'quiz', label: 'Quiz Builder' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'review', label: 'Review Submissions' },
];

export default function QuizzesPage() {
  const [tab, setTab] = useState('quiz');
  const { data: courses } = useQuery({ queryKey: ['trainer-courses'], queryFn: getTrainerCourses });
  const { data: pendingCount } = useQuery({ queryKey: ['trainer-pending-review-count'], queryFn: getPendingReviewCount });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-neutral-200 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative text-body-sm font-semibold px-4 py-2.5 cursor-pointer transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-[var(--trainer-blue)] text-[var(--trainer-blue)]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t.label}
            {t.id === 'review' && !!pendingCount && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-pill bg-danger-50 text-danger-600 text-[10.5px] font-bold align-middle">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'quiz' && <QuizBuilderTab courses={courses} />}
      {tab === 'assignments' && <AssignmentsTab courses={courses} />}
      {tab === 'review' && <ReviewSubmissionsTab />}
    </div>
  );
}
