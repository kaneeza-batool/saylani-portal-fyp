import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchStudents } from '../../../services/studentService';
import { markMultipleAttendance } from '../../../services/studentAttendanceService';

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

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

export default function MultiAttendance() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['students-for-multi-attendance', { search }],
    queryFn: () => fetchStudents({ search, status: 'enrolled', page: 1, limit: 50 }),
  });

  const students = data?.students ?? [];

  const toggle = (rollNumber) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rollNumber)) next.delete(rollNumber);
      else next.add(rollNumber);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.rollNumber)));
  };

  const markMutation = useMutation({
    mutationFn: () => markMultipleAttendance({ rollNumbers: Array.from(selected), status: 'present' }),
    onSuccess: (res) => {
      setResult(res);
      setSelected(new Set());
    },
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[280px] focus-within:border-royal-500 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search enrolled students..."
            className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
          />
        </div>

        <button
          type="button"
          onClick={() => markMutation.mutate()}
          disabled={selected.size === 0 || markMutation.isPending}
          className="border-none bg-royal-500 text-white text-body font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-royal-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {markMutation.isPending ? 'Marking...' : `Mark ${selected.size || ''} Present`.trim()}
        </button>
      </div>

      {result && (
        <div className="text-caption text-success-text bg-success-bg border border-success-bg rounded px-3 py-2">
          Marked {result.marked} present{result.skipped ? ` · ${result.skipped} already marked today` : ''}
          {result.notFound ? ` · ${result.notFound} not found` : ''}.
        </div>
      )}

      <motion.div variants={fadeInUp} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[40px_1.5fr_1fr_1.2fr] gap-[16px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200 items-center">
          <input type="checkbox" checked={students.length > 0 && selected.size === students.length} onChange={toggleAll} className="cursor-pointer" />
          <span className="text-overline uppercase text-neutral-500">Student</span>
          <span className="text-overline uppercase text-neutral-500">Roll No.</span>
          <span className="text-overline uppercase text-neutral-500">Course</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[40px_1.5fr_1fr_1.2fr] gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100">
              <div className="h-4 w-4 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
            </div>
          ))
        ) : students.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No enrolled students match this search.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {students.map((s) => (
              <motion.label
                key={s._id}
                variants={fadeInUp}
                className="grid grid-cols-[40px_1.5fr_1fr_1.2fr] gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50 cursor-pointer"
              >
                <input type="checkbox" checked={selected.has(s.rollNumber)} onChange={() => toggle(s.rollNumber)} className="cursor-pointer" />
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-neutral-100 text-primary-600 flex items-center justify-center font-heading font-bold text-badge shrink-0">
                    {initials(s.name)}
                  </div>
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</span>
                </div>
                <span className="text-body-sm text-neutral-600">{s.rollNumber}</span>
                <span className="text-body-sm text-neutral-600 truncate">{s.course}</span>
              </motion.label>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
