import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchTrainerAttendance } from '../../../services/trainerAttendanceService';
import { createAttendanceRequest } from '../../../services/attendanceRequestService';
import AttendanceCorrectionModal from '../../../components/AttendanceCorrectionModal';

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.3fr_1.1fr_1fr_1fr_1fr_0.8fr]';

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}
function duration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function TrainersAttendanceView() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [correctionRecord, setCorrectionRecord] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trainer-attendance', { search, page }],
    queryFn: () => fetchTrainerAttendance({ search, page, limit: 10 }),
    keepPreviousData: true,
  });

  const requestMutation = useMutation({
    mutationFn: createAttendanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] });
      setCorrectionRecord(null);
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to submit request.'),
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[280px] focus-within:border-gold-500 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by trainer, employee ID, campus..."
            className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
          />
        </div>
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        <div className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Trainer', 'Campus', 'Check In', 'Check Out', 'Duration'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
          <span className="text-overline uppercase text-neutral-500 text-right">Action</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load attendance. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No trainer attendance recorded yet.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {items.map((r) => (
              <motion.div
                key={r._id}
                variants={fadeInUp}
                className={`grid ${GRID_COLS} gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
              >
                <div className="min-w-0">
                  <div className="text-body-sm font-semibold text-neutral-900 truncate">{r.trainerName}</div>
                  <div className="text-badge text-neutral-400 font-normal">{fmtDate(r.date)}</div>
                </div>
                <span className="text-body-sm text-neutral-600 truncate">{r.campus || '—'}</span>
                <span className="text-body-sm text-neutral-600">{fmtTime(r.checkIn)}</span>
                <span className="text-body-sm text-neutral-600">{fmtTime(r.checkOut)}</span>
                <span className="text-body-sm text-neutral-600">{duration(r.checkIn, r.checkOut)}</span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError('');
                      setCorrectionRecord(r);
                    }}
                    title="Request correction"
                    className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {!isLoading && !isError && total > 0 && (
        <div className="flex items-center justify-between text-body-sm text-neutral-400">
          <span>
            {total} record{total === 1 ? '' : 's'} · Page {page} of {pages}
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

      <AttendanceCorrectionModal
        open={!!correctionRecord}
        record={correctionRecord}
        onClose={() => setCorrectionRecord(null)}
        onSubmit={(payload) => requestMutation.mutate(payload)}
        submitting={requestMutation.isPending}
        error={formError}
      />
    </motion.div>
  );
}
