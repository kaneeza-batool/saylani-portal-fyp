import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getMyJobApplications, getMyJobs, updateMyJobApplicationStatus } from '../../services/employerPortalService';
import ApplicantProfilePanel from '../../components/ApplicantProfilePanel';

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

const STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  reviewed: { label: 'Reviewed', className: 'bg-info-bg text-info-text' },
  shortlisted: { label: 'Shortlisted', className: 'bg-success-bg text-success-text' },
  hired: { label: 'Hired', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobFilter = searchParams.get('job') || 'all';
  const [viewTarget, setViewTarget] = useState(null);

  const { data: jobs } = useQuery({ queryKey: ['employer-my-jobs'], queryFn: getMyJobs });
  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ['employer-my-applications', jobFilter],
    queryFn: () => getMyJobApplications(jobFilter === 'all' ? undefined : jobFilter),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateMyJobApplicationStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['employer-my-applications'] });
      setViewTarget(updated);
    },
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="font-heading font-bold text-h5 text-neutral-900">Applications</div>
        <select
          value={jobFilter}
          onChange={(e) => setSearchParams(e.target.value === 'all' ? {} : { job: e.target.value })}
          className="border border-neutral-200 bg-surface rounded px-3 py-2 text-body-sm outline-none focus:border-gold-500"
        >
          <option value="all">All jobs</option>
          {jobs?.map((j) => (
            <option key={j._id} value={j._id}>{j.title}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 w-full bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">
          Couldn't load applications.
        </div>
      ) : !applications?.length ? (
        <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
          No applications yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {applications.map((app) => {
            const style = STATUS_STYLE[app.status] ?? STATUS_STYLE.pending;
            return (
              <motion.div
                key={app._id}
                variants={fadeInUp}
                onClick={() => setViewTarget(app)}
                className="bg-surface border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap cursor-pointer hover:border-gold-500/50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">{app.fullName}</span>
                  <span className="text-caption text-neutral-500">Applied for {app.jobTitle}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.matchScore !== null && app.matchScore !== undefined && (
                    <span className="text-badge text-neutral-500">{app.matchScore}% match</span>
                  )}
                  <span className={`text-badge px-2.5 py-1 rounded-pill ${style.className}`}>{style.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ApplicantProfilePanel
        open={!!viewTarget}
        application={viewTarget}
        onClose={() => setViewTarget(null)}
        onStatusChange={(status) => statusMutation.mutate({ id: viewTarget._id, status })}
        statusUpdating={statusMutation.isPending}
      />
    </motion.div>
  );
}
