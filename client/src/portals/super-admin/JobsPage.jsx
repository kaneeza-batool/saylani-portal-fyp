import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { createJob, deleteJob, fetchJobs, updateJob } from '../../services/jobService';
import JobFormModal from '../../components/JobFormModal';

const STATUS_STYLE = {
  open: { label: 'Open', className: 'bg-success-bg text-success-text' },
  closed: { label: 'Closed', className: 'bg-neutral-100 text-neutral-500' },
};

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.6fr_1.4fr_1.2fr_1fr_0.8fr_0.8fr]';

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, status]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', { search, status, page }],
    queryFn: () => fetchJobs({ search, status, page, limit: 8 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['jobs'] });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      invalidate();
      setModal({ open: false, mode: 'add', item: null });
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to add job.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: () => {
      invalidate();
      setModal({ open: false, mode: 'add', item: null });
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to update job.'),
  });

  const deleteMutation = useMutation({ mutationFn: deleteJob, onSuccess: invalidate });

  const openAdd = () => {
    setFormError('');
    setModal({ open: true, mode: 'add', item: null });
  };
  const openEdit = (item) => {
    setFormError('');
    setModal({ open: true, mode: 'edit', item });
  };
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = (values) => {
    if (modal.mode === 'add') createMutation.mutate(values);
    else updateMutation.mutate({ id: modal.item._id, payload: values });
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.title}"? This can't be undone.`)) deleteMutation.mutate(item._id);
  };

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[250px] focus-within:border-royal-500 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search jobs..."
              className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-white outline-none focus:border-royal-500 transition-colors"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="border-none bg-royal-500 text-white text-body font-semibold px-4 py-[10px] rounded cursor-pointer flex items-center gap-2 transition-colors hover:bg-royal-600"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Job
        </button>
      </div>

      <motion.div variants={fadeInUp} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Title', 'Company', 'Location', 'Type', 'Status'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
          <span className="text-overline uppercase text-neutral-500 text-right">Actions</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load jobs. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No jobs match this search.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {items.map((j) => {
              const s = STATUS_STYLE[j.status] ?? STATUS_STYLE.open;
              return (
                <motion.div
                  key={j._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{j.title}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{j.company}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{j.location || '—'}</span>
                  <span className="text-body-sm text-neutral-600">{j.type}</span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${s.className}`}>{s.label}</span>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => openEdit(j)}
                      title="Edit"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-white rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(j)}
                      title="Delete"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-white rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-danger-50 hover:border-danger-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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
            {total} job{total === 1 ? '' : 's'} · Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-neutral-200 bg-white text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="border border-neutral-200 bg-white text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <JobFormModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.item}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={formError}
      />
    </motion.div>
  );
}
