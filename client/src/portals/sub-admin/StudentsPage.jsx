import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchStudents, updateStudent } from '../../services/studentService';
import { generateFeeVoucher } from '../../services/feeService';
import StudentFormModal from '../../components/StudentFormModal';
import ExportButtons from '../../components/ExportButtons';
import ConfirmDialog from '../../components/ConfirmDialog';
import IDCardModal from '../../components/IDCardModal';

// Reuses super-admin/StudentsPage.jsx's table shell (same GRID_COLS
// approach, same classes, same STATUS_STYLE/PAYMENT_STYLE) but trimmed to
// what a campus manager actually has: no Campus column/filter (a sub_admin
// only ever has one campus — see req.campusFilter server-side), no Add/
// Delete (POST and DELETE /admin/students are super_admin-only), Edit only
// (PATCH already allows sub_admin + STUDENT:update). Batch column is new
// (Task A). No ID-card/export actions — not part of this page's scope.
//
// STATUS_FILTERS deliberately excludes 'pending' and 'rejected' — those are
// admissions applicants, not roster members (see AdmissionsQueuePage.jsx),
// and `roster: true` on the fetchStudents call below enforces the same
// exclusion server-side for the default "All" view too (studentController's
// getStudents: roster=true adds `status: { $nin: ['pending','rejected'] }`).

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropout', label: 'Dropout' },
];

const STATUS_STYLE = {
  enrolled: { label: 'Enrolled', className: 'bg-info-bg text-info-text' },
  completed: { label: 'Completed', className: 'bg-success-bg text-success-text' },
  dropout: { label: 'Dropout', className: 'bg-danger-50 text-danger-600' },
};

// Driven by feeStatus (server-computed from the current month's FeeVoucher,
// see studentController.getStudents), not the separate Student.payment
// field the edit-student modal still manages — that field only exists to
// trigger the payment/dropout cascade and isn't what this column reflects.
const PAYMENT_STYLE = {
  not_generated: { label: 'Not Generated', className: 'bg-neutral-100 text-neutral-500' },
  paid: { label: 'Paid', className: 'bg-success-bg text-success-text' },
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  overdue: { label: 'Overdue', className: 'bg-danger-50 text-danger-600' },
};

const DROP_REASON_LABEL = {
  payment: 'Dropped for overdue payment — will auto-restore if payment is marked paid.',
  attendance: 'Dropped for attendance below 70% — must be re-enrolled manually.',
  manual: 'Dropped manually by an admin.',
};

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

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.6fr_1.1fr_1.2fr_1.3fr_0.8fr_1fr_1fr_0.9fr]';

const EXPORT_COLUMNS = [
  { header: 'Name', accessor: (s) => s.name },
  { header: 'CNIC', accessor: (s) => s.cnic },
  { header: 'Phone', accessor: (s) => s.phone },
  { header: 'Course', accessor: (s) => s.course },
  { header: 'Batch', accessor: (s) => s.batch?.schedule },
  { header: 'Progress', accessor: (s) => (s.progress != null ? `${s.progress}%` : '') },
  { header: 'Status', accessor: (s) => s.status },
  { header: 'Payment Status', accessor: (s) => (s.feeStatus ? PAYMENT_STYLE[s.feeStatus.status]?.label ?? s.feeStatus.status : '—') },
];

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-neutral-100 animate-pulse shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <div className="h-3 w-2/3 bg-neutral-100 rounded animate-pulse" />
          <div className="h-2.5 w-1/2 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [formError, setFormError] = useState('');
  const [dropTarget, setDropTarget] = useState(null);
  const [idCardTarget, setIdCardTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, status]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-students', { search, status, page }],
    queryFn: () => fetchStudents({ search, status, page, limit: 8, roster: true }),
    keepPreviousData: true,
  });

  // Also invalidates the Dashboard's own student query — without this, a
  // status change here (e.g. dropping a student out) left the Dashboard's
  // "Students" KPI showing stale data until the sub-admin manually reloaded
  // the page, since the two pages cache under different query keys.
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['sub-admin-dashboard-students'] });
      setEditTarget(null);
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to update student.'),
  });

  // Separate from updateMutation (tied to the edit-form modal's own
  // open/close state) — these are one-click actions from the row itself.
  const statusMutation = useMutation({
    mutationFn: ({ id, payload }) => updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['sub-admin-dashboard-students'] });
      setDropTarget(null);
    },
  });

  const openEdit = (student) => {
    setFormError('');
    setEditTarget(student);
  };
  const closeModal = () => setEditTarget(null);
  const handleSubmit = (values) => updateMutation.mutate({ id: editTarget._id, payload: values });

  const handleDrop = (student) => setDropTarget(student);
  const confirmDrop = () => {
    if (dropTarget) statusMutation.mutate({ id: dropTarget._id, payload: { status: 'dropout' } });
  };
  const handleReenroll = (student) => statusMutation.mutate({ id: student._id, payload: { status: 'enrolled' } });

  const generateMutation = useMutation({
    mutationFn: (studentId) => generateFeeVoucher(studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-admin-students'] }),
  });

  const students = data?.students ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[250px] focus-within:border-gold-500 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search students..."
              className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <ExportButtons title="Students" filenameBase="titan-subadmin-students" columns={EXPORT_COLUMNS} rows={students} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Student', 'Phone', 'Course', 'Batch', 'Progress', 'Status', 'Payment Status'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
          <span className="text-overline uppercase text-neutral-500 text-right">Actions</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4, 5].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load students. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No students match this search.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {students.map((s) => {
              const statusStyle = STATUS_STYLE[s.status] ?? STATUS_STYLE.enrolled;
              const paymentStyle = s.feeStatus ? PAYMENT_STYLE[s.feeStatus.status] ?? PAYMENT_STYLE.pending : null;
              return (
                <motion.div
                  key={s._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-navy-50 text-navy-700 flex items-center justify-center font-heading font-bold text-caption shrink-0">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</div>
                      <div className="text-badge text-neutral-400 font-normal">{s.cnic}</div>
                    </div>
                  </div>
                  <span className="text-body-sm text-neutral-600">{s.phone}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{s.course}</span>
                  {s.batch?.schedule ? (
                    <span className="text-body-sm text-neutral-600 truncate">{s.batch.schedule}</span>
                  ) : s.status === 'enrolled' ? (
                    <span
                      className="text-badge px-2 py-0.5 rounded-pill w-fit bg-warning-bg text-warning-text"
                      title="Enrolled with no batch assigned — won't appear on any Trainer Portal roster until fixed"
                    >
                      No batch
                    </span>
                  ) : (
                    <span className="text-body-sm text-neutral-400">—</span>
                  )}
                  <span className="text-body-sm text-neutral-600">{s.progress != null ? `${s.progress}%` : '—'}</span>
                  <span
                    className={`text-badge px-2.5 py-1 rounded-pill w-fit ${statusStyle.className}`}
                    title={s.status === 'dropout' ? DROP_REASON_LABEL[s.dropReason] || undefined : undefined}
                  >
                    {statusStyle.label}
                  </span>
                  {paymentStyle ? (
                    <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${paymentStyle.className}`}>{paymentStyle.label}</span>
                  ) : (
                    <span className="text-body-sm text-neutral-400">—</span>
                  )}
                  <div className="flex gap-1.5 justify-end">
                    {s.feeStatus?.status === 'not_generated' && (
                      <button
                        type="button"
                        onClick={() => generateMutation.mutate(s._id)}
                        disabled={generateMutation.isPending && generateMutation.variables === s._id}
                        title="Generate this month's fee voucher"
                        className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-gold-50 hover:border-gold-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B7862C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="M12 9v6M9 12h6" />
                        </svg>
                      </button>
                    )}
                    {s.status === 'dropout' ? (
                      <button
                        type="button"
                        onClick={() => handleReenroll(s)}
                        disabled={statusMutation.isPending}
                        title="Re-enroll"
                        className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-success-bg hover:border-success-text disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B6B45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDrop(s)}
                        disabled={statusMutation.isPending}
                        title="Drop student"
                        className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-danger-50 hover:border-danger-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M9 9l6 6M15 9l-6 6" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/sub-admin/fees?studentId=${s._id}&studentName=${encodeURIComponent(s.name)}`)}
                      title="View fees / change due date"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M8 14h2M13 14h3" />
                      </svg>
                    </button>
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
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      title="Edit"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} student{total === 1 ? '' : 's'} · Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <StudentFormModal
        open={!!editTarget}
        mode="edit"
        initialValues={editTarget}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        error={formError}
      />

      <ConfirmDialog
        open={!!dropTarget}
        title="Drop student"
        message={dropTarget ? `Drop ${dropTarget.name}? They can be re-enrolled from this page at any time.` : ''}
        confirmLabel="Drop"
        onCancel={() => setDropTarget(null)}
        onConfirm={confirmDrop}
        loading={statusMutation.isPending}
      />

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
                line2: idCardTarget.campus?.name,
                // GET /admin/students is already campus-scoped for a
                // sub_admin (req.campusFilter, see studentController), so
                // every row here is already their own campus — nothing
                // extra to enforce for "campus-scoped" beyond reusing this
                // page's existing data.
                photo: idCardTarget.avatarUrl ? `${import.meta.env.VITE_STUDENT_PORTAL_URL_BASE}${idCardTarget.avatarUrl}` : undefined,
              }
            : null
        }
      />
    </motion.div>
  );
}
