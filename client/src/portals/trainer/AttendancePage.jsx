import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// Layout/content sourced from the "ATTENDANCE MARKING" section of
// TITAN Trainer Portal.html: batch + date pickers, a mark-all-present
// shortcut, present/absent/leave summary tiles, and a roster with a
// per-student three-way status toggle. No backend yet, so batches and
// students are dummy data shaped like what this page will eventually load.
const BATCH_OPTIONS = [
  'Web Development · B-24',
  'Graphic Designing · B-19',
  'Digital Marketing · B-31',
  'Cloud Computing · B-08',
];

const INITIAL_STUDENTS = [
  { id: 1, name: 'Ayesha Siddiqui', roll: '241', initials: 'AS', status: 'present' },
  { id: 2, name: 'Bilal Hussain', roll: '242', initials: 'BH', status: 'present' },
  { id: 3, name: 'Sana Malik', roll: '243', initials: 'SM', status: 'absent' },
  { id: 4, name: 'Usman Tariq', roll: '244', initials: 'UT', status: 'present' },
  { id: 5, name: 'Hira Khan', roll: '245', initials: 'HK', status: 'leave' },
  { id: 6, name: 'Fahad Nawaz', roll: '246', initials: 'FN', status: 'present' },
  { id: 7, name: 'Mariam Aslam', roll: '247', initials: 'MA', status: 'present' },
  { id: 8, name: 'Zain Abbas', roll: '248', initials: 'ZA', status: 'absent' },
];

// Reused verbatim from ViewAttendance.jsx's STATUS_STYLE so present/absent/leave
// always mean the same colors everywhere in the app.
const STATUS_STYLE = {
  present: { label: 'Present', className: 'bg-success-bg text-success-text' },
  absent: { label: 'Absent', className: 'bg-danger-50 text-danger-600' },
  leave: { label: 'Leave', className: 'bg-warning-bg text-warning-text' },
};
const STATUS_ORDER = ['present', 'absent', 'leave'];

const SUMMARY_TEXT_COLOR = {
  present: 'text-success-text',
  absent: 'text-danger-600',
  leave: 'text-warning-text',
};

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

function StudentRow({ student, onSetStatus }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between px-[18px] py-[13px] border-b border-neutral-100 last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded shrink-0 bg-neutral-100 text-success-text flex items-center justify-center font-heading font-bold text-[12px]">
          {student.initials}
        </div>
        <div>
          <div className="text-body-sm font-semibold text-neutral-900">{student.name}</div>
          <div className="text-[11.5px] text-neutral-400">Roll #{student.roll}</div>
        </div>
      </div>

      <div className="flex border border-neutral-200 rounded overflow-hidden">
        {STATUS_ORDER.map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => onSetStatus(student.id, key)}
            className={[
              'px-3.5 py-[7px] text-[12px] font-bold cursor-pointer transition-colors',
              i > 0 ? 'border-l border-neutral-200' : '',
              student.status === key ? STATUS_STYLE[key].className : 'bg-white text-neutral-400 hover:bg-neutral-100',
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
  const [batch, setBatch] = useState(BATCH_OPTIONS[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  const counts = useMemo(
    () => students.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {}),
    [students]
  );

  const setStatus = (id, status) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const markAllPresent = () => setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm font-semibold text-neutral-900 font-sans bg-white outline-none focus:border-royal-500 transition-colors"
          >
            {BATCH_OPTIONS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-neutral-200 rounded px-3 py-[9px] text-body-sm text-neutral-600 font-sans bg-white outline-none focus:border-royal-500 transition-colors"
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
          <div key={key} className="bg-white border border-neutral-200 rounded-xl px-[18px] py-4 text-center">
            <div className={`font-heading font-extrabold text-[24px] ${SUMMARY_TEXT_COLOR[key]}`}>{counts[key] ?? 0}</div>
            <div className="text-[12px] font-semibold text-neutral-400 mt-0.5">{STATUS_STYLE[key].label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {students.map((student) => (
          <StudentRow key={student.id} student={student} onSetStatus={setStatus} />
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl px-[18px] py-3.5 flex justify-end">
        <button
          type="button"
          className="border-none bg-royal-500 text-white text-body-sm font-semibold px-6 py-[11px] rounded cursor-pointer transition-colors hover:bg-royal-600"
        >
          Save Attendance
        </button>
      </div>
    </motion.div>
  );
}
