import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  fetchApplications,
  fetchJobOptions,
  updateApplicationStatus,
  deleteApplication,
} from '../../services/jobApplicationService';
import ApplicantProfilePanel from '../../components/ApplicantProfilePanel';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportButtons from '../../components/ExportButtons';

const STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  reviewed: { label: 'Reviewed', className: 'bg-info-bg text-info-text' },
  shortlisted: { label: 'Shortlisted', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

const EXPORT_COLUMNS = [
  { header: 'Candidate', accessor: (a) => a.fullName },
  { header: 'Email', accessor: (a) => a.email },
  { header: 'Phone', accessor: (a) => a.phone },
  { header: 'Job', accessor: (a) => a.jobTitle },
  { header: 'Match Score', accessor: (a) => a.matchScore ?? '' },
  { header: 'Status', accessor: (a) => a.status },
];

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const GRID_COLS = 'grid-cols-[1.3fr_1.3fr_0.9fr_0.9fr_0.8fr_0.9fr_0.8fr]';

function MatchBadge({ score }) {
  if (score === null || score === undefined) return <span className="text-body-sm text-neutral-300">—</span>;
  const className = score >= 70 ? 'bg-success-bg text-success-text' : score >= 40 ? 'bg-warning-bg text-warning-text' : 'bg-neutral-100 text-neutral-500';
  return <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${className}`}>{score}% match</span>;
}

function RowSkeleton() {
  return (
    <div className={`grid ${GRID_COLS} min-w-[720px] gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobApplicationsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [job, setJob] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [search, status, job, sort]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job-applications', { search, status, job, sort, page }],
    queryFn: () => fetchApplications({ search, status, job, sort, page, limit: 8 }),
    keepPreviousData: true,
  });

  const { data: jobOptions } = useQuery({ queryKey: ['job-options'], queryFn: fetchJobOptions });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['job-applications'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: newStatus }) => updateApplicationStatus(id, newStatus),
    onSuccess: (updated) => {
      invalidate();
      setViewTarget(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      setViewTarget(null);
    },
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 rounded px-3 py-2 w-[250px] focus-within:border-gold-500 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A9A93" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search applicants..."
              className="border-none bg-transparent outline-none text-body-sm w-full font-sans text-neutral-900"
            />
          </div>
          <select
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All jobs</option>
            {jobOptions?.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-neutral-200 rounded px-2.5 py-[9px] text-body-sm text-neutral-600 font-sans bg-surface outline-none focus:border-gold-500 transition-colors"
          >
            <option value="recent">Newest first</option>
            <option value="match">Best match first</option>
          </select>
        </div>

        <ExportButtons title="Job Applications" filenameBase="titan-job-applications" columns={EXPORT_COLUMNS} rows={items} />
      </div>

      <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[720px] gap-[16px] px-[18px] py-3.5 bg-neutral-50 border-b border-neutral-200`}>
          {['Candidate', 'Job', 'Phone', 'Applied', 'Match', 'Status'].map((h) => (
            <span key={h} className="text-overline uppercase text-neutral-500">
              {h}
            </span>
          ))}
          <span className="text-overline uppercase text-neutral-500 text-right">Actions</span>
        </div>

        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : isError ? (
          <div className="py-14 px-5 text-center text-danger-600 text-body-sm">Couldn't load applications. Please try again.</div>
        ) : items.length === 0 ? (
          <div className="py-14 px-5 text-center text-neutral-400 text-body-sm">No applications match this search.</div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {items.map((a) => {
              const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.pending;
              return (
                <motion.div
                  key={a._id}
                  variants={fadeInUp}
                  className={`grid ${GRID_COLS} min-w-[720px] gap-[16px] px-[18px] py-3.5 items-center border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50`}
                >
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{a.fullName}</span>
                  <span className="text-body-sm text-neutral-600 truncate">{a.jobTitle}</span>
                  <span className="text-body-sm text-neutral-600">{a.phone}</span>
                  <span className="text-body-sm text-neutral-600">{fmtDate(a.createdAt)}</span>
                  <MatchBadge score={a.matchScore} />
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${s.className}`}>{s.label}</span>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setViewTarget(a)}
                      title="View profile"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-neutral-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
                      title="Delete"
                      className="w-[30px] h-[30px] border border-neutral-200 bg-surface rounded-sm cursor-pointer flex items-center justify-center transition-colors hover:bg-danger-50 hover:border-danger-200"
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
            {total} application{total === 1 ? '' : 's'} · Page {page} of {pages}
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

      <ApplicantProfilePanel
        open={!!viewTarget}
        application={viewTarget}
        onClose={() => setViewTarget(null)}
        onStatusChange={(newStatus) => statusMutation.mutate({ id: viewTarget._id, status: newStatus })}
        statusUpdating={statusMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete application"
        message={deleteTarget ? `Delete the application from ${deleteTarget.fullName}? This can't be undone.` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        loading={deleteMutation.isPending}
      />
    </motion.div>
  );
}
