import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { inputClass, labelClass } from './formFieldStyles';
import { getTrainerCourses, getMyQuizzes, createQuiz } from '../../services/trainerDashboardService';

// Layout/content sourced from the "QUIZ BUILDER" section of
// TITAN Trainer Portal.html: quiz meta (title/course/duration/marks)
// followed by editable question cards and an "Add Question" affordance.
// Backed for real now — Course is Student Portal's actual course catalog
// (not a batch dropdown; a quiz targets a course, matching how Student
// Portal's own quiz list is scoped, see quizController.getQuizzes), and
// saving here writes into the exact collection Student Portal reads from.
function emptyQuestion(id) {
  return {
    id,
    marks: 5,
    text: '',
    explanation: '',
    options: [0, 1, 2, 3].map((n) => ({ id: id + n + 1, text: '', correct: n === 0 })),
  };
}

const INITIAL_QUESTIONS = [emptyQuestion(1)];

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

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

export default function QuizzesPage() {
  const queryClient = useQueryClient();
  const { data: courses } = useQuery({ queryKey: ['trainer-courses'], queryFn: getTrainerCourses });
  const { data: myQuizzes } = useQuery({ queryKey: ['trainer-quizzes'], queryFn: getMyQuizzes });

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('');
  const [course, setCourse] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
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
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HTML & CSS Basics"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Module</label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. Module 1: Basics"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Course</label>
              <select value={course} onChange={(e) => setCourse(e.target.value)} className={`${inputClass} bg-surface`}>
                {!courses?.length && <option value="">Loading courses…</option>}
                {courses?.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
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

        {formError && (
          <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{formError}</div>
        )}

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
