import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { inputClass, labelClass } from './formFieldStyles';

// Layout/content sourced from the "QUIZ BUILDER" section of
// TITAN Trainer Portal.html: quiz meta (title/batch/duration/marks/
// schedule/integrity mode) followed by editable question cards and an
// "Add Question" affordance. The design's Live Preview slide-out is
// skipped per instructions. No backend yet, so this starts from a
// couple of dummy questions shaped like what will eventually load/save.
const BATCH_OPTIONS = [
  'Web Development · B-24',
  'Graphic Designing · B-19',
  'Digital Marketing · B-31',
  'Cloud Computing · B-08',
];

const INITIAL_QUESTIONS = [
  {
    id: 1,
    marks: 5,
    text: 'What does HTML stand for?',
    options: [
      { id: 1, text: 'Hyper Trainer Markup Language', correct: false },
      { id: 2, text: 'Hyper Text Markup Language', correct: true },
      { id: 3, text: 'High Text Machine Language', correct: false },
      { id: 4, text: 'Hyperlink Text Management Language', correct: false },
    ],
  },
  {
    id: 2,
    marks: 5,
    text: 'Which CSS property controls text size?',
    options: [
      { id: 5, text: 'font-style', correct: false },
      { id: 6, text: 'text-size', correct: false },
      { id: 7, text: 'font-size', correct: true },
      { id: 8, text: 'text-style', correct: false },
    ],
  },
];

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`w-[42px] h-6 rounded-pill relative shrink-0 border-none cursor-pointer transition-colors ${on ? 'bg-[var(--trainer-blue)]' : 'bg-neutral-200'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left] duration-150 ${on ? 'left-[20px]' : 'left-0.5'}`}
      />
    </button>
  );
}

function QuestionCard({ question, index, onChangeMarks, onChangeText, onChangeOptionText, onSetCorrect }) {
  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-[18px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-neutral-400">Question {index + 1}</span>
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
              className={`flex-1 min-w-0 border-none bg-transparent outline-none text-body-sm font-sans ${
                opt.correct ? 'text-success-text' : 'text-neutral-900'
              }`}
            />
          </label>
        ))}
      </div>
    </motion.div>
  );
}

export default function QuizzesPage() {
  const [title, setTitle] = useState('');
  const [batch, setBatch] = useState(BATCH_OPTIONS[0]);
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [integrityMode, setIntegrityMode] = useState(true);
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);

  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0), [questions]);

  const addQuestion = () => {
    const id = Date.now();
    setQuestions((prev) => [
      ...prev,
      {
        id,
        marks: 5,
        text: '',
        options: [0, 1, 2, 3].map((n) => ({ id: id + n + 1, text: '', correct: n === 0 })),
      },
    ]);
  };

  const updateQuestion = (id, patch) => setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const updateOption = (qid, oid, patch) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) } : q))
    );

  const setCorrectOption = (qid, oid) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, options: q.options.map((o) => ({ ...o, correct: o.id === oid })) } : q))
    );

  return (
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

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Batch</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)} className={`${inputClass} bg-surface`}>
              {BATCH_OPTIONS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Start Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>End Time</label>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-3 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-neutral-900">Enable Integrity Mode</span>
            <span
              title="Detects tab switches and exits from fullscreen during the quiz, logging each incident for review."
              className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10.5px] font-bold cursor-help"
            >
              i
            </span>
          </div>
          <Toggle on={integrityMode} onToggle={() => setIntegrityMode((v) => !v)} />
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
          onChangeMarks={(id, marks) => updateQuestion(id, { marks })}
          onChangeText={(id, text) => updateQuestion(id, { text })}
          onChangeOptionText={(qid, oid, text) => updateOption(qid, oid, { text })}
          onSetCorrect={setCorrectOption}
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
    </motion.div>
  );
}
