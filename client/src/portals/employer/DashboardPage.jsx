import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getMyEmployerProfile, getMyJobs, createMyJob, updateMyJob } from '../../services/employerPortalService';

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

const STATUS_STYLE = {
  pending: { label: 'Pending Verification', className: 'bg-warning-bg text-warning-text' },
  verified: { label: 'Verified', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

const emptyJobForm = { title: '', location: '', type: 'Full-time', description: '', requirements: '', published: true };

function JobFormModal({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(emptyJobForm);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      requirements: form.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(13,25,53,0.35)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-surface border border-neutral-200 rounded-xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
      >
        <div className="px-6 py-[18px] border-b border-neutral-200 font-heading font-bold text-h6 text-neutral-900">
          Post a Job
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-neutral-600">Job Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-neutral-600">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-neutral-600">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500 bg-surface"
              >
                {['Full-time', 'Part-time', 'Internship', 'Contract'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-neutral-600">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-neutral-600">Requirements (one per line)</label>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              className="border border-neutral-200 rounded px-3 py-[10px] text-body-sm outline-none focus:border-gold-500 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 accent-gold-500 cursor-pointer"
            />
            <span className="text-body-sm text-neutral-700">Publish immediately once verified</span>
          </label>

          {error && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-neutral-200 bg-surface text-neutral-700 text-body-sm font-semibold px-4 py-2.5 rounded cursor-pointer hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-2.5 rounded cursor-pointer hover:bg-gold-600 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data: employer, isLoading: employerLoading } = useQuery({
    queryKey: ['employer-my-profile'],
    queryFn: getMyEmployerProfile,
  });
  const { data: jobs, isLoading: jobsLoading } = useQuery({ queryKey: ['employer-my-jobs'], queryFn: getMyJobs });

  const createMutation = useMutation({
    mutationFn: createMyJob,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employer-my-jobs'] });
      setModalOpen(false);
      setNotice(result.notice);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }) => updateMyJob(id, { published }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employer-my-jobs'] });
      if (result.notice) setNotice(result.notice);
    },
  });

  const statusInfo = employer ? STATUS_STYLE[employer.status] : null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-heading font-bold text-h5 text-neutral-900">My Jobs</div>
          {!employerLoading && employer && <div className="text-body-sm text-neutral-400 mt-0.5">{employer.companyName}</div>}
        </div>
        <div className="flex items-center gap-2.5">
          {statusInfo && <span className={`text-caption font-semibold px-3 py-1.5 rounded-pill ${statusInfo.className}`}>{statusInfo.label}</span>}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="border-none bg-gold-500 text-white text-caption font-semibold px-4 py-2.5 rounded cursor-pointer hover:bg-gold-600"
          >
            Post a Job
          </button>
        </div>
      </div>

      {!employerLoading && employer?.status !== 'verified' && (
        <div className="bg-warning-bg border border-warning-text/30 rounded-xl p-3.5 text-body-sm text-warning-text">
          Your company isn't verified yet. Jobs you post are saved as drafts and won't appear on the public careers page until a TITAN admin verifies your account.
        </div>
      )}

      {notice && (
        <div className="bg-warning-bg border border-warning-text/30 rounded-xl p-3 flex items-center justify-between gap-3 text-body-sm text-warning-text">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="border-none bg-transparent text-warning-text cursor-pointer text-caption font-semibold shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {jobsLoading ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !jobs?.length ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          You haven't posted any jobs yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              variants={fadeInUp}
              className="bg-surface border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold text-neutral-900 truncate">{job.title}</span>
                <span className="text-caption text-neutral-500">{job.location || 'Remote'} · {job.type}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-badge px-2.5 py-1 rounded-pill ${job.published ? 'bg-success-bg text-success-text' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  {job.published ? 'Live' : 'Draft'}
                </span>
                <button
                  type="button"
                  disabled={togglePublishMutation.isPending}
                  onClick={() => togglePublishMutation.mutate({ id: job._id, published: !job.published })}
                  className="border border-neutral-200 bg-surface text-neutral-700 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer hover:bg-neutral-100 disabled:opacity-50"
                >
                  {job.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link
                  to={`/employer/applications?job=${job._id}`}
                  className="border border-neutral-200 bg-surface text-neutral-700 text-caption font-semibold px-3 py-[7px] rounded no-underline hover:bg-neutral-100"
                >
                  Applications
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <JobFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        submitting={createMutation.isPending}
        error={createMutation.error?.response?.data?.message}
      />
    </motion.div>
  );
}
