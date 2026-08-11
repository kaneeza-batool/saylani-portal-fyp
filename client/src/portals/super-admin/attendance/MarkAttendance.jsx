import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { lookupStudentByRollNumber, markStudentAttendance } from '../../../services/studentAttendanceService';

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

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const PAYMENT_STYLE = {
  paid: { label: 'Paid', className: 'bg-success-bg text-success-text' },
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  overdue: { label: 'Overdue', className: 'bg-danger-50 text-danger-600' },
};

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export default function MarkAttendance() {
  const [rollNumber, setRollNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;
    setError('');
    setStudent(null);
    setVerifying(true);
    try {
      const data = await lookupStudentByRollNumber(rollNumber.trim());
      setStudent(data.student);
      setToday(data.today);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No student found with that roll number.');
    } finally {
      setVerifying(false);
    }
  };

  const markMutation = useMutation({
    mutationFn: () => markStudentAttendance({ rollNumber: student.rollNumber }),
    onSuccess: (record) => setToday(record),
    onError: (err) => setError(err.response?.data?.message || 'Failed to mark attendance.'),
  });

  const paymentStyle = student ? PAYMENT_STYLE[student.payment] ?? PAYMENT_STYLE.pending : null;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="grid grid-cols-[1.2fr_1fr] gap-4 items-start">
      <div className="flex flex-col gap-4">
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          <div className="font-heading font-bold text-h6 text-neutral-900">Student Attendance</div>
          <form onSubmit={handleLookup} className="flex gap-2.5">
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Scan or enter Roll Number..."
              className="flex-1 border border-neutral-200 rounded px-3 py-[10px] text-body-sm font-sans outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={verifying}
              className="border-none bg-gold-500 text-white text-body font-semibold px-5 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50"
            >
              {verifying ? 'Looking up...' : 'Mark Attendance'}
            </button>
          </form>
          {error && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>}
        </div>

        {student && (
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-h5 border border-gold-500/40">
              {initials(student.name)}
            </div>
            <div className="text-center">
              <div className="font-heading font-bold text-h6 text-neutral-900">{student.name}</div>
              <div className="text-body-sm text-neutral-400">Roll Number: {student.rollNumber}</div>
              <div className="text-body-sm text-neutral-400">{student.course} · {student.campus}</div>
            </div>
            {paymentStyle && <span className={`text-badge px-2.5 py-1 rounded-pill ${paymentStyle.className}`}>{paymentStyle.label}</span>}

            {today ? (
              <div className="flex items-center gap-1.5 text-success-text text-body-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12l3 3 5-6" />
                </svg>
                Attendance Marked
              </div>
            ) : (
              <button
                type="button"
                onClick={() => markMutation.mutate()}
                disabled={markMutation.isPending}
                className="border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50"
              >
                {markMutation.isPending ? 'Marking...' : 'Confirm Present'}
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
        <div className="font-heading font-bold text-h6 text-neutral-900">Attendance History</div>
        {!student ? (
          <div className="text-body-sm text-neutral-400">Look up a student to see their recent attendance.</div>
        ) : history.length === 0 ? (
          <div className="text-body-sm text-neutral-400">No attendance history found.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h._id} className="flex items-center justify-between text-body-sm">
                <span className="text-neutral-600">{fmtDate(h.date)}</span>
                <span
                  className={`text-badge px-2 py-0.5 rounded-pill ${
                    h.status === 'present' ? 'bg-success-bg text-success-text' : h.status === 'leave' ? 'bg-warning-bg text-warning-text' : 'bg-danger-50 text-danger-600'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
