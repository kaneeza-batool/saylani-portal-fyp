import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getTrainerDashboard } from '../../services/trainerDashboardService';

const GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D'];

const SUBMISSION_STYLE = {
  submitted: { label: 'Submitted', className: 'bg-success-bg text-success-text' },
  late: { label: 'Late', className: 'bg-warning-bg text-warning-text' },
  not_submitted: { label: 'Not Submitted', className: 'bg-danger-50 text-danger-600' },
};

const INITIAL_STUDENTS = [
  { name: 'Zara Ahmed', attendance: 96, quizAvg: 91, submission: 'submitted', grade: 'A+' },
  { name: 'Taimoor Sheikh', attendance: 84, quizAvg: 78, submission: 'late', grade: 'B' },
  { name: 'Kiran Solangi', attendance: 92, quizAvg: 88, submission: 'submitted', grade: 'A' },
  { name: 'Waleed Junejo', attendance: 61, quizAvg: 54, submission: 'not_submitted', grade: 'D' },
  { name: 'Areeba Shaikh', attendance: 70, quizAvg: 66, submission: 'late', grade: 'C' },
  { name: 'Furqan Memon', attendance: 89, quizAvg: 85, submission: 'submitted', grade: 'A' },
];

const GRID_COLS = 'grid-cols-[1.6fr_0.9fr_0.9fr_1.1fr_1fr]';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

export default function StudentsPage() {
  const { data } = useQuery({ queryKey: ['trainer-dashboard'], queryFn: getTrainerDashboard });
  const batchOptions = (data?.batches ?? []).map((b) => `${b.course} · ${b.campus}`);
  const [batch, setBatch] = useState('');
  const [published, setPublished] = useState(false);
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  if (batchOptions.length && !batch) {
    setBatch(batchOptions[0]);
  }

  const setGrade = (name, grade) => setStudents((prev) => prev.map((s) => (s.name === name ? { ...s, grade } : s)));

  const publishResults = () => {
    setPublished(true);
    setTimeout(() => setPublished(false), 2500);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm font-semibold text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
        >
          {batchOptions.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={publishResults}
          className="border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-[18px] py-[10px] rounded cursor-pointer transition-colors hover:brightness-90"
        >
          {published ? 'Published ✓' : 'Publish Results'}
        </button>
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-4 px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Attendance', 'Quiz Avg', 'Assignment', 'Grade'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          {students.map((s) => {
            const style = SUBMISSION_STYLE[s.submission];
            return (
              <motion.div
                key={s.name}
                variants={fadeInUp}
                className={`grid ${GRID_COLS} gap-4 px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded shrink-0 bg-success-bg text-success-text flex items-center justify-center font-heading font-bold text-[12px]">
                    {initials(s.name)}
                  </div>
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</span>
                </div>
                <span className="text-body-sm text-neutral-600">{s.attendance}%</span>
                <span className="text-body-sm text-neutral-600">{s.quizAvg}%</span>
                <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${style.className}`}>{style.label}</span>
                <select
                  value={s.grade}
                  onChange={(e) => setGrade(s.name, e.target.value)}
                  className="border border-neutral-200 rounded px-2.5 py-[7px] text-caption font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors w-fit"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}