import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getMyAttendanceCourses, getAttendanceRoster } from '../../services/trainerDashboardService';

// Read-only — attendance is now marked entirely by Super Admin/Sub-Admin
// scanning a student's ID card QR (see server/controllers/
// attendanceScanController.js), not by the trainer. This page still reads
// from the same StudentAttendance collection (via trainerStudentAttendanceController
// .getRosterForDate, unchanged) so a trainer can see their class's status at
// a glance; there's no way to change it from here anymore. A student who
// thinks a record is wrong requests a correction from their own portal.
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

// Anyone with no record yet for the selected date reads as "Not marked" —
// distinct from Present/Absent/Leave, not folded into either, since it's
// not yet a real attendance decision.
function StatusPill({ status, alreadyMarked }) {
  if (!alreadyMarked) {
    return <span className="text-badge px-2.5 py-1 rounded-pill w-fit bg-neutral-100 text-neutral-500">Not marked</span>;
  }
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.present;
  return <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${s.className}`}>{s.label}</span>;
}

function StudentRow({ row }) {
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
      <StatusPill status={row.status} alreadyMarked={row.alreadyMarked} />
    </motion.div>
  );
}

export default function AttendancePage() {
  const { data: courses } = useQuery({ queryKey: ['trainer-attendance-courses'], queryFn: getMyAttendanceCourses });
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!course && courses?.length) setCourse(courses[0].name);
  }, [courses, course]);

  const { data: roster, isLoading } = useQuery({
    queryKey: ['trainer-attendance-roster', course, date],
    queryFn: () => getAttendanceRoster(course, date),
    enabled: !!course && !!date,
  });

  const effectiveRoster = roster ?? [];

  const counts = useMemo(
    () => effectiveRoster.filter((r) => r.alreadyMarked).reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {}),
    [effectiveRoster]
  );
  const notMarkedCount = effectiveRoster.filter((r) => !r.alreadyMarked).length;

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
        <p className="text-caption text-neutral-400 max-w-[260px] text-right">
          Marked by your campus's QR scanner — view only.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATUS_ORDER.map((key) => (
          <div key={key} className={`${SUMMARY_BG[key]} border border-neutral-200 rounded-xl px-[18px] py-4 text-center`}>
            <div className={`font-heading font-extrabold text-[24px] ${SUMMARY_TEXT_COLOR[key]}`}>{counts[key] ?? 0}</div>
            <div className="text-[12px] font-semibold text-neutral-400 mt-0.5">{STATUS_STYLE[key].label}</div>
          </div>
        ))}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-[18px] py-4 text-center">
          <div className="font-heading font-extrabold text-[24px] text-neutral-500">{notMarkedCount}</div>
          <div className="text-[12px] font-semibold text-neutral-400 mt-0.5">Not Marked</div>
        </div>
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
          effectiveRoster.map((row) => <StudentRow key={row.student._id} row={row} />)
        )}
      </div>
    </motion.div>
  );
}
