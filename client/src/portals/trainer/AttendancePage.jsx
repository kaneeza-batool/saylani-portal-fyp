import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrainerCourses, getAttendanceRoster, markAttendance } from '../../services/trainerDashboardService';

// Real now — writes into the same StudentAttendance collection Super Admin
// and Sub-Admin already read from (see trainerStudentAttendanceController
// .js on the server), so marking attendance here shows up there
// immediately, same cross-portal proof point as the quiz/assignment work.
// Course-scoped rather than batch-scoped for the same reason as the
// Assignments tab: Student has no batch/Slot field to query a roster by.
const STATUS_STYLE = {
  present: { label: 'Present', className: 'bg-success-bg text-success-text' },
  absent: { label: 'Absent', className: 'bg-danger-50 text-danger-600' },
  leave: { label: 'Leave', className: 'bg-warning-bg text-warning-text' },
};
const STATUS_ORDER = ['present', 'absent', 'leave'];

const SUMMARY_TEXT_COLOR = { present: 'text-success-text', absent: 'text-danger-600', leave: 'text-warning-text' };
const SUMMARY_BG = { present: 'bg-success-bg', absent: 'bg-danger-50', leave: 'bg-warning-bg' };

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

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

function StudentRow({ row, onSetStatus }) {
  return (
    <motion.div variants={fadeInUp} className="flex items-center justify-between px-[18px] py-[13px] border-b border-neutral-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded shrink-0 bg-success-bg text-success-text flex items-center justify-center font-heading font-bold text-[12px]">
          {initials(row.student.name)}
        </div>
        <div>
          <div className="text-body-sm font-semibold text-neutral-900">{row.student.name}</div>
          <div className="text-[11.5px] text-neutral-400">Roll #{row.student.rollNumber}</div>
        </div>
      </div>

      <div className="flex border border-neutral-200 rounded overflow-hidden">
        {STATUS_ORDER.map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => onSetStatus(row.student._id, key)}
            className={[
              'px-3.5 py-[7px] text-[12px] font-bold cursor-pointer transition-colors',
              i > 0 ? 'border-l border-neutral-200' : '',
              row.status === key ? STATUS_STYLE[key].className : 'bg-surface text-neutral-400 hover:bg-neutral-100',
            ].join(' ')}
          >
            {STATUS_STYLE[key].label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { data: courses } = useQuery({ queryKey: ['trainer-courses'], queryFn: getTrainerCourses });
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (!course && courses?.length) setCourse(courses[0].name);
  }, [courses, course]);

  const { data: roster, isLoading } = useQuery({
    queryKey: ['trainer-attendance-roster', course, date],
    queryFn: () => getAttendanceRoster(course, date),
    enabled: !!course && !!date,
  });

  // Overrides reset whenever the roster for a new course/date loads, so
  // toggling a status doesn't leak across a batch/date switch.
  useEffect(() => setOverrides({}), [course, date]);

  const effectiveRoster = useMemo(
    () => (roster ?? []).map((row) => ({ ...row, status: overrides[row.student._id] ?? row.status })),
    [roster, overrides]
  );

  const counts = useMemo(
    () => effectiveRoster.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {}),
    [effectiveRoster]
  );

  const setStatus = (studentId, status) => setOverrides((prev) => ({ ...prev, [studentId]: status }));
  const markAllPresent = () => setOverrides(Object.fromEntries(effectiveRoster.map((r) => [r.student._id, 'present'])));

  const saveMutation = useMutation({
    mutationFn: () =>
      markAttendance({
        course,
        date,
        records: effectiveRoster.map((r) => ({ studentId: r.student._id, status: r.status })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-attendance-roster', course, date] });
      setOverrides({});
    },
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm font-semibold text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
          >
            {!courses?.length && <option value="">Loading…</option>}
            {courses?.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={markAllPresent}
          className="border border-success-bg bg-success-bg text-success-text text-body-sm font-semibold px-3.5 py-[9px] rounded cursor-pointer transition-colors hover:brightness-95"
        >
          Mark All Present
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STATUS_ORDER.map((key) => (
          <div key={key} className={`${SUMMARY_BG[key]} border border-neutral-200 rounded-xl px-[18px] py-4 text-center`}>
            <div className={`font-heading font-extrabold text-[24px] ${SUMMARY_TEXT_COLOR[key]}`}>{counts[key] ?? 0}</div>
            <div className="text-[12px] font-semibold text-neutral-400 mt-0.5">{STATUS_STYLE[key].label}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !effectiveRoster.length ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No students enrolled in this course yet.</div>
        ) : (
          effectiveRoster.map((row) => <StudentRow key={row.student._id} row={row} onSetStatus={setStatus} />)
        )}
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl px-[18px] py-3.5 flex justify-end">
        <button
          type="button"
          disabled={saveMutation.isPending || !effectiveRoster.length}
          onClick={() => saveMutation.mutate()}
          className="border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-6 py-[11px] rounded cursor-pointer transition-colors hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving...' : saveMutation.isSuccess ? 'Saved ✓' : 'Save Attendance'}
        </button>
      </div>
    </motion.div>
  );
}
