import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { createTrainer, fetchTrainers, updateTrainerStatus, resetTrainerPassword } from '../../services/trainerService';
import TrainerFormModal from '../../components/TrainerFormModal';
import ExportButtons from '../../components/ExportButtons';
import ResetPasswordResultModal from '../../components/ResetPasswordResultModal';
import IDCardModal from '../../components/IDCardModal';

// Mostly a read-only mirror of super-admin/TrainersPage.jsx's list (same
// GRID_COLS approach, same classes) — sub_admin still has no update/delete
// permission on a trainer's full fields (see trainerRoutes.js), just three
// narrow write paths: status toggle (PATCH /:id/status), password reset
// (PATCH /:id/reset-password), and create (campus-locked server-side in
// trainerRoutes.js's lockTrainerCampusForSubAdmin — this page doesn't need
// to enforce that itself, TrainerFormModal already locks the Campus field
// client-side for a sub_admin same as StudentFormModal does). No edit
// modal. GET / is already campus-scoped server-side via campusScope, so
// this page needs no campus filter of its own.

const STATUS_STYLE = {
  active: { label: 'Active', className: 'bg-success-bg text-success-text' },
  inactive: { label: 'Inactive', className: 'bg-neutral-100 text-neutral-500' },
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
const GRID_COLS = 'grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr]';

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

const EXPORT_COLUMNS = [
  { header: 'Name', accessor: (t) => t.name },
  { header: 'Email', accessor: (t) => t.email },
  { header: 'Employee ID', accessor: (t) => t.employeeId },
  { header: 'Course', accessor: (t) => t.course },
  { header: 'City', accessor: (t) => t.city },
  { header: 'Status', accessor: (t) => t.status },
];

export default function TrainersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [idCardTarget, setIdCardTarget] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, status]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-trainers', { search, status, page }],
    queryFn: () => fetchTrainers({ search, status, page, limit: 8 }),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateTrainerStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-admin-trainers'] }),
  });

  const createMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-admin-trainers'] });
      setAddOpen(false);
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to add trainer.'),
  });

  const openAdd = () => {
    setFormError('');
    setAddOpen(true);
  };

  const resetPasswordMutation = useMutation({
    mutationFn: resetTrainerPassword,
    onSuccess: (result) => {
      setResetError(null);
      setResetResult(result);
    },
    onError: (err) => setResetError(err.response?.data?.message || 'Failed to reset password.'),
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      {resetError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-body-sm text-red-700">
          <span>{resetError}</span>
          <button
            type="button"
            onClick={() => setResetError(null)}
            className="border-none bg-transparent text-red-700 cursor-pointer font-semibold shrink-0 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

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
              placeholder="Search trainers..."
              className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportButtons title="Trainers" filenameBase="titan-subadmin-trainers" columns={EXPORT_COLUMNS} rows={items} />
          <button
            type="button"
            onClick={openAdd}
            className="border-none bg-gold-500 text-white text-body font-semibold px-4 py-[10px] rounded cursor-pointer flex items-center gap-2 transition-colors hover:bg-gold-600"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Trainer
          </button>
        </div>
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Trainer', 'Email', 'Employee ID', 'Course', 'City', 'Status', 'Actions'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load trainers. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No trainers match this search.</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {items.map((t) => {
              const s = STATUS_STYLE[t.status] ?? STATUS_STYLE.active;
              const isSaving = statusMutation.isPending && statusMutation.variables?.id === t._id;
              const nextStatus = t.status === 'active' ? 'inactive' : 'active';
              return (
                <motion.div
                  key={t._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} min-w-[720px] gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-navy-50 text-navy-700 flex items-center justify-center font-heading font-bold text-caption shrink-0">
                      {initials(t.name)}
                    </div>
                    <span className="text-body-sm font-semibold text-neutral-900 truncate">{t.name}</span>
                  </div>
                  <span className="text-body-sm text-neutral-600 truncate">{t.email}</span>
                  <span className="text-body-sm text-neutral-600">{t.employeeId}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{t.course || '—'}</span>
                  <span className="text-body-sm text-neutral-600">{t.city || '—'}</span>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => statusMutation.mutate({ id: t._id, nextStatus })}
                    title={`Mark ${nextStatus}`}
                    className={`text-badge px-2.5 py-1 rounded-pill w-fit cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${s.className}`}
                  >
                    {isSaving ? 'Saving…' : s.label}
                  </button>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setIdCardTarget(t)}
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
                      onClick={() => resetPasswordMutation.mutate(t._id)}
                      disabled={resetPasswordMutation.isPending}
                      title="Reset Password"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
            {total} trainer{total === 1 ? '' : 's'} · Page {page} of {pages}
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

      <TrainerFormModal
        open={addOpen}
        mode="add"
        initialValues={null}
        onClose={() => setAddOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        submitting={createMutation.isPending}
        error={formError}
      />
      <ResetPasswordResultModal open={!!resetResult} result={resetResult} onClose={() => setResetResult(null)} />
      <IDCardModal
        open={!!idCardTarget}
        onClose={() => setIdCardTarget(null)}
        type="Trainer"
        person={
          idCardTarget
            ? { name: idCardTarget.name, idNumber: idCardTarget.employeeId, line1: idCardTarget.course, line2: idCardTarget.city }
            : null
        }
      />
    </motion.div>
  );
}
