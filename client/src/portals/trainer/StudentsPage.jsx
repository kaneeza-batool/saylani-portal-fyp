import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getTrainerCourses, getMyStudents } from '../../services/trainerDashboardService';

// Real now — 30-day attendance rate (same present/(present+absent)
// convention the Super Admin dashboard uses) and assignment completion
// ("submitted 3/4" — out of everything this trainer has actually
// assigned, computed live), replacing the old hardcoded 6-student mock
// list and "Publish Results" button that never persisted anything.
const GRID_COLS = 'grid-cols-[1.6fr_1fr_1.3fr]';

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

function attendanceTone(pct) {
  if (pct == null) return 'text-neutral-400';
  if (pct >= 80) return 'text-success-text';
  if (pct >= 60) return 'text-warning-text';
  return 'text-danger-600';
}

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

export default function StudentsPage() {
  const { data: courses } = useQuery({ queryKey: ['trainer-courses'], queryFn: getTrainerCourses });
  const [course, setCourse] = useState('');

  useEffect(() => {
    if (!course && courses?.length) setCourse(courses[0].name);
  }, [courses, course]);

  const { data: students, isLoading } = useQuery({
    queryKey: ['trainer-students', course],
    queryFn: () => getMyStudents(course),
    enabled: !!course,
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <select
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        className="self-start border border-neutral-200 rounded px-3 py-[9px] text-body-sm font-semibold text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
      >
        {!courses?.length && <option value="">Loading…</option>}
        {courses?.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-4 px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Attendance (30d)', 'Assignments'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !students?.length ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No students enrolled in this course yet.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {students.map((s) => (
              <motion.div
                key={s._id}
                variants={fadeInUp}
                className={`grid ${GRID_COLS} gap-4 px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded shrink-0 bg-success-bg text-success-text flex items-center justify-center font-heading font-bold text-[12px]">
                    {initials(s.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</div>
                    <div className="text-badge text-neutral-400 font-normal">Roll #{s.rollNumber}</div>
                  </div>
                </div>
                <span className={`text-body-sm font-semibold ${attendanceTone(s.attendancePct)}`}>
                  {s.attendancePct == null ? 'No data' : `${s.attendancePct}%`}
                </span>
                <span className="text-body-sm text-neutral-600">
                  {s.assignmentsTotal === 0 ? '—' : `${s.assignmentsSubmitted} / ${s.assignmentsTotal} submitted`}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
