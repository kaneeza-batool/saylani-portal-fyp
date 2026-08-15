import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getTrainerDashboard } from '../../services/trainerDashboardService';

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

const SUMMARY_BG = {
  present: 'bg-success-bg',
  absent: 'bg-danger-50',
  leave: 'bg-warning-bg',
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
        <div className="w-[34px] h-[34px] rounded shrink-0 bg-success-bg text-success-text flex items-center justify-center font-heading font-bold text-[12px]">
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
              student.status === key ? STATUS_STYLE[key].className : 'bg-surface text-neutral-400 hover:bg-neutral-100',
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
  const { data } = useQuery({ queryKey: ['trainer-dashboard'], queryFn: getTrainerDashboard });
  const batchOptions = (data?.batches ?? []).map((b) => `${b.course} · ${b.campus}`);
  const [batch, setBatch] = useState('');
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  if (batchOptions.length && !batch) {
    setBatch(batchOptions[0]);
  }

  const counts = useMemo(
    () => students.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {}),
    [students]
  );

  const setStatus = (id, status) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const markAllPresent = () => setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));

  const saveAttendance = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
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
        {students.map((student) => (
          <StudentRow key={student.id} student={student} onSetStatus={setStatus} />
        ))}
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl px-[18px] py-3.5 flex justify-end">
        <button
          type="button"
          onClick={saveAttendance}
          className="border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-6 py-[11px] rounded cursor-pointer transition-colors hover:brightness-90"
        >
          {saved ? 'Saved ✓' : 'Save Attendance'}
        </button>
      </div>
    </motion.div>
  );
}