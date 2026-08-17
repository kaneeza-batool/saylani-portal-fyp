import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { inputClass, labelClass } from './formFieldStyles';
import AssignmentFormModal from '../../components/AssignmentFormModal';
import {
  getTrainerCourses,
  getMyQuizzes,
  createQuiz,
  getMyAssignments,
  createAssignment,
  getAssignmentRoster,
  getPendingReviewCount,
  reviewSubmission,
} from '../../services/trainerDashboardService';

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

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
              className="border-none bg-transparent text-danger-600 text-[12px] font-semibold cursor-pointer hover:underline px-1.5 py-1"
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
// Assignments — full lifecycle: create, see a roster-level submission
// status per assignment, approve. Students submit through Student Portal's
// existing (already-built, untouched) submission flow.
//
// Rosters are scoped by course, not batch — Student has no batch/Slot
// field anywhere in this schema (see server/models/Student.js and the
// Slot model's own comments), so "every student assigned this batch" isn't
// a relationship that actually exists to query. Course is the real
// equivalent: it's the same field Student Portal itself scopes quizzes and
// assignments by (see getAssignmentRoster on the server).
// ---------------------------------------------------------------------------
const SUBMISSION_STATUS_STYLE = {
  not_submitted: { label: 'Not Submitted', className: 'bg-neutral-100 text-neutral-500' },
  submitted: { label: 'Submitted', className: 'bg-info-bg text-info-text' },
  late_submitted: { label: 'Late', className: 'bg-warning-bg text-warning-text' },
  approved: { label: 'Approved', className: 'bg-success-bg text-success-text' },
  not_approved: { label: 'Needs Revision', className: 'bg-danger-50 text-danger-600' },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function StatBadge({ label, value, className }) {
  return (
    <span className={`text-badge px-2 py-1 rounded-pill w-fit ${className}`}>
      {value} {label}
    </span>
  );
}

function AssignmentListView({ assignments, isLoading, onSelect, onNewClick }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h6 text-neutral-900">Your Assignments</div>
        <button
          type="button"
          onClick={onNewClick}
          className="border-none bg-[var(--trainer-blue)] text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-opacity hover:opacity-90"
        >
          + New Assignment
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !assignments?.length ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] text-center text-body-sm text-neutral-400">
          No assignments created yet — click "+ New Assignment" to create your first one.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
          {assignments.map((a) => (
            <motion.button
              key={a._id}
              type="button"
              variants={fadeInUp}
              onClick={() => onSelect(a._id)}
              className="text-left bg-surface border border-neutral-200 rounded-xl p-[18px] flex items-center justify-between gap-4 flex-wrap cursor-pointer transition-colors hover:border-[var(--trainer-blue)]"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold text-neutral-900">{a.title}</span>
                <span className="text-caption text-neutral-500">
                  {a.course}
                  {a.isHackathon ? ' · Hackathon' : ''} · Due {fmtDate(a.dueDate)}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <StatBadge label="Submitted" value={a.stats?.submitted ?? 0} className="bg-info-bg text-info-text" />
                <StatBadge label="Pending" value={a.stats?.pending ?? 0} className="bg-warning-bg text-warning-text" />
                <StatBadge label="Approved" value={a.stats?.approved ?? 0} className="bg-success-bg text-success-text" />
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function RosterRow({ row, onReview, isPending }) {
  const style = SUBMISSION_STATUS_STYLE[row.status] ?? SUBMISSION_STATUS_STYLE.not_submitted;
  const isDecided = row.status === 'approved' || row.status === 'not_approved';
  const canReview = row.status === 'submitted' || row.status === 'late_submitted';

  return (
    <motion.div
      variants={fadeInUp}
      className="grid grid-cols-[1.6fr_1fr_1fr_1.4fr] gap-3 px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded bg-navy-50 text-navy-700 flex items-center justify-center font-heading font-bold text-caption shrink-0">
          {initials(row.student?.name)}
        </div>
        <span className="text-body-sm font-semibold text-neutral-900 truncate">{row.student?.name}</span>
      </div>

      <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${style.className}`}>{style.label}</span>

      <span className="text-body-sm text-neutral-600">{row.submittedAt ? fmtDate(row.submittedAt) : '—'}</span>

      <div className="flex items-center gap-2 justify-end">
        {row.submissionLink && (
          <a
            href={row.submissionLink}
            target="_blank"
            rel="noreferrer"
            className="text-caption font-semibold text-[var(--trainer-blue)] hover:underline"
          >
            View Submission
          </a>
        )}
        {canReview && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onReview(row.submissionId, 'approved')}
            className="border-none bg-success-text text-white text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {isDecided && (
          <span className={`text-caption font-semibold ${row.status === 'approved' ? 'text-success-text' : 'text-danger-600'}`}>
            {row.status === 'approved' ? 'Approved ✓' : 'Needs Revision'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function AssignmentDetailView({ assignmentId, onBack }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['trainer-assignment-roster', assignmentId],
    queryFn: () => getAssignmentRoster(assignmentId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewSubmission(id, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-assignment-roster', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-pending-review-count'] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start border-none bg-transparent text-caption font-semibold text-[var(--trainer-blue)] cursor-pointer hover:underline px-1.5 py-1 -mx-1.5"
      >
        ← Back to Assignments
      </button>

      {isLoading || !data ? (
        <div className="h-40 bg-neutral-100 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="flex flex-col gap-0.5">
            <div className="font-heading font-bold text-h5 text-neutral-900">{data.assignment.title}</div>
            <div className="text-body-sm text-neutral-500">
              {data.assignment.course} · Due {fmtDate(data.assignment.dueDate)}
            </div>
          </div>

          <div className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1.4fr] gap-3 px-[18px] py-3 bg-neutral-50 border-b border-neutral-200 min-w-[600px]">
              {['Student', 'Status', 'Submitted', 'Action'].map((h) => (
                <span key={h} className="text-overline uppercase text-neutral-500">
                  {h}
                </span>
              ))}
            </div>
            {!data.roster.length ? (
              <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No students enrolled in this course yet.</div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="min-w-[600px]">
                {data.roster.map((row) => (
                  <RosterRow
                    key={row.student._id}
                    row={row}
                    onReview={(id, decision) => reviewMutation.mutate({ id, decision })}
                    isPending={reviewMutation.isPending}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AssignmentsTab({ courses }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({ queryKey: ['trainer-assignments'], queryFn: getMyAssignments });

  const createMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-assignments'] });
      setModalOpen(false);
    },
  });

  if (view === 'detail') {
    return <AssignmentDetailView assignmentId={selectedId} onBack={() => setView('list')} />;
  }

  return (
    <>
      <AssignmentListView
        assignments={assignments}
        isLoading={isLoading}
        onSelect={(id) => {
          setSelectedId(id);
          setView('detail');
        }}
        onNewClick={() => setModalOpen(true)}
      />
      <AssignmentFormModal
        open={modalOpen}
        courses={courses}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        submitting={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level tab switcher — Quiz Builder (unchanged) and Assignments (full
// lifecycle: create -> roster -> approve, all in one tab).
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'quiz', label: 'Quiz Builder' },
  { id: 'assignments', label: 'Assignments' },
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
            {t.id === 'assignments' && !!pendingCount && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-pill bg-danger-50 text-danger-600 text-[10.5px] font-bold align-middle">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'quiz' && <QuizBuilderTab courses={courses} />}
      {tab === 'assignments' && <AssignmentsTab courses={courses} />}
    </div>
  );
}
