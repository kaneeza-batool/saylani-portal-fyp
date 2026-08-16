import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTrainerDashboard, getMyStudents, setStudentGrade } from '../../services/trainerDashboardService';
import IDCardModal from '../../components/IDCardModal';

const GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D'];

const SUBMISSION_STYLE = {
  not_submitted: { label: 'Not Submitted', className: 'bg-danger-50 text-danger-600' },
  submitted: { label: 'Submitted', className: 'bg-warning-bg text-warning-text' },
  late_submitted: { label: 'Late', className: 'bg-warning-bg text-warning-text' },
  approved: { label: 'Approved', className: 'bg-success-bg text-success-text' },
  not_approved: { label: 'Needs Revision', className: 'bg-danger-50 text-danger-600' },
};

const GRID_COLS = 'grid-cols-[1.6fr_0.9fr_0.9fr_1.1fr_1fr_0.7fr]';

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
  const { data: dashboard } = useQuery({ queryKey: ['trainer-dashboard'], queryFn: getTrainerDashboard });
  const batches = dashboard?.batches ?? [];
  const [batchId, setBatchId] = useState('');
  const [idCardTarget, setIdCardTarget] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (batches.length && !batchId) setBatchId(String(batches[0].id));
  }, [batches, batchId]);

  const {
    data: students,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['trainer-students', batchId],
    queryFn: () => getMyStudents(batchId),
    enabled: Boolean(batchId),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ studentId, grade }) => setStudentGrade(studentId, grade),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-students', batchId] }),
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <select
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        className="w-fit border border-neutral-200 rounded px-3 py-[9px] text-body-sm font-semibold text-neutral-900 font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors"
      >
        {batches.length === 0 && <option value="">No batches assigned</option>}
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.course} · {b.campus}
          </option>
        ))}
      </select>

      {isError && (
        <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">
          {error?.response?.data?.message || 'Failed to load students. Please try again.'}
        </div>
      )}

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-4 px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Attendance', 'Quiz Avg', 'Assignment', 'Grade'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
          <span className="text-overline uppercase text-neutral-500 text-right">ID Card</span>
        </div>

        {isLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !students?.length ? (
          <div className="px-[18px] py-8 text-center text-body-sm text-neutral-400">
            {batches.length === 0 ? 'You have no assigned batches yet.' : 'No students in this batch yet.'}
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {students.map((s) => {
              const style = SUBMISSION_STYLE[s.submission] || SUBMISSION_STYLE.not_submitted;
              const isSaving = gradeMutation.isPending && gradeMutation.variables?.studentId === s.studentId;
              return (
                <motion.div
                  key={s.studentId}
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
                  <span className={`text-body-sm font-semibold ${attendanceTone(s.attendance)}`}>
                    {s.attendance != null ? `${s.attendance}%` : '—'}
                  </span>
                  <span className="text-body-sm text-neutral-600">{s.quizAvg != null ? `${s.quizAvg}%` : '—'}</span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${style.className}`}>{style.label}</span>
                  <select
                    value={s.grade || ''}
                    disabled={isSaving}
                    onChange={(e) => gradeMutation.mutate({ studentId: s.studentId, grade: e.target.value })}
                    className="border border-neutral-200 rounded px-2.5 py-[7px] text-caption font-sans bg-surface outline-none focus:border-[var(--trainer-blue)] transition-colors w-fit disabled:opacity-50"
                  >
                    <option value="" disabled>
                      —
                    </option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIdCardTarget(s)}
                      title="ID Card"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <circle cx="8" cy="11" r="2" />
                        <path d="M5 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
                        <path d="M14 10h5M14 14h5" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <IDCardModal
        open={!!idCardTarget}
        onClose={() => setIdCardTarget(null)}
        type="Student"
        person={
          idCardTarget
            ? {
                name: idCardTarget.name,
                idNumber: idCardTarget.rollNumber,
                line1: idCardTarget.course,
                // getMyStudents is already scoped to the trainer's own
                // batches (myBatchesFilter, server-side) — nothing extra to
                // enforce here for "own-batch-only" beyond reusing this
                // page's existing, already-scoped roster data.
                line2: idCardTarget.campus,
                photo: idCardTarget.avatarUrl ? `${import.meta.env.VITE_STUDENT_PORTAL_URL_BASE}${idCardTarget.avatarUrl}` : undefined,
              }
            : null
        }
      />
    </motion.div>
  );
}
