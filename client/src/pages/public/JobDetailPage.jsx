import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicJob } from '../../services/publicJobService';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

// Same fix as server/controllers/publicJobController.js's isPastDeadline —
// applicationDeadline parses as UTC midnight, so comparing that instant
// directly closed applications hours into the deadline day itself for any
// timezone ahead of UTC. Extending to the end of that UTC day keeps this
// badge/CTA in sync with what the server actually still accepts.
function isPastDeadline(applicationDeadline) {
  if (!applicationDeadline) return false;
  const endOfDeadlineDay = new Date(applicationDeadline);
  endOfDeadlineDay.setUTCHours(23, 59, 59, 999);
  return endOfDeadlineDay.getTime() < Date.now();
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { data: job, isLoading, isError } = useQuery({ queryKey: ['public-job', id], queryFn: () => fetchPublicJob(id) });

  if (isLoading) {
    return <div className="h-64 bg-surface border border-neutral-200 rounded-xl animate-pulse" />;
  }

  if (isError || !job) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-10 text-center flex flex-col gap-3 items-center">
        <div className="text-body text-danger-600">This job posting isn't available — it may have closed.</div>
        <Link to="/careers" className="text-body-sm font-semibold text-gold-600 hover:underline">
          Back to all openings
        </Link>
      </div>
    );
  }

  const deadlinePassed = isPastDeadline(job.applicationDeadline);
  const applyCta = deadlinePassed ? (
    <span className="shrink-0 border border-neutral-200 bg-neutral-100 text-neutral-400 text-body font-semibold px-5 py-[11px] rounded cursor-not-allowed">
      Applications Closed
    </span>
  ) : (
    <Link
      to={`/careers/${job._id}/apply`}
      className="shrink-0 border-none bg-gold-500 text-white text-body font-semibold px-5 py-[11px] rounded cursor-pointer transition-colors hover:bg-gold-600"
    >
      Apply Now
    </Link>
  );

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5">
      <Link to="/careers" className="text-caption font-semibold text-neutral-500 hover:text-gold-600 transition-colors w-fit">
        &larr; All openings
      </Link>

      <div className="bg-surface border border-neutral-200 rounded-xl p-7 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading font-bold text-h4 text-navy-900">{job.title}</h1>
            <div className="text-body text-neutral-500 mt-1">{job.company}</div>
          </div>
          {applyCta}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {job.location && <span className="text-badge px-2.5 py-1 rounded-pill bg-neutral-100 text-neutral-600">{job.location}</span>}
          <span className="text-badge px-2.5 py-1 rounded-pill bg-info-bg text-info-text">{job.type}</span>
          {job.applicationDeadline && (
            <span className={`text-badge px-2.5 py-1 rounded-pill ${deadlinePassed ? 'bg-danger-50 text-danger-600' : 'bg-neutral-100 text-neutral-600'}`}>
              {deadlinePassed ? 'Deadline passed: ' : 'Apply by '}
              {new Date(job.applicationDeadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {job.description && (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="font-heading font-bold text-body text-neutral-900">Description</div>
            <p className="text-body-sm text-neutral-600 whitespace-pre-line">{job.description}</p>
          </div>
        )}

        {job.requirements?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="font-heading font-bold text-body text-neutral-900">Requirements</div>
            <ul className="flex flex-col gap-1.5">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-body-sm text-neutral-600">
                  <span className="w-[6px] h-[6px] rounded-full bg-gold-500 mt-2 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-2 self-start">{applyCta}</div>
      </div>
    </motion.div>
  );
}
