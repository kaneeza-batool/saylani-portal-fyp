import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchSlots } from '../../services/slotService';

// Read-only mirror of super-admin's slot/batch data (same GRID_COLS approach,
// same classes as sub-admin/TrainersPage.jsx) minus any Actions column —
// sub_admin has no create/update/delete permission on Slot (see
// slotRoutes.js), and GET / is already campus-scoped server-side via
// campusScope, so this page needs no campus filter of its own.
//
// Columns are real Slot model fields (schedule, course, trainer, campus,
// seats, gender, status) plus `studentCount`, which the server computes via
// an aggregation over Student.batch (see slotRoutes.js withStudentCounts) —
// not a model field itself, so it's not filterable/sortable, just displayed.

const STATUS_STYLE = {
  active: { label: 'Active', className: 'bg-success-bg text-success-text' },
  inactive: { label: 'Inactive', className: 'bg-neutral-100 text-neutral-500' },
};

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.5fr_1.1fr_0.9fr_1.1fr_0.7fr_0.9fr_0.7fr_0.8fr]';

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function BatchesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, status]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['sub-admin-batches', { search, status, page }],
    queryFn: () => fetchSlots({ search, status, page, limit: 8 }),
    keepPreviousData: true,
  });

  const items = data?.items ?? [];
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
              placeholder="Search batches..."
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
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Schedule', 'Course', 'Trainer', 'Campus', 'Seats', 'Gender', 'Status', 'Students'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm flex flex-col items-center gap-3">
            <span>Couldn't load batches. Please try again.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No batches match this search.</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            {items.map((b) => {
              const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.active;
              return (
                <motion.div
                  key={b._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} gap-[18px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{b.schedule}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{b.course}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{b.trainer}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{b.campus?.name || '—'}</span>
                  <span className="text-body-sm text-neutral-600">{b.seatsFilled} / {b.seatsTotal}</span>
                  <span className="text-body-sm text-neutral-600">{b.gender}</span>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${s.className}`}>{s.label}</span>
                  <span className="text-body-sm text-neutral-600">{b.studentCount}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} batch{total === 1 ? '' : 'es'} · Page {page} of {pages}
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
    </motion.div>
  );
}
