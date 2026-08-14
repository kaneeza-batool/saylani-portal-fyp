import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchPublicJobs } from '../../services/publicJobService';

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function CareersPage() {
  const { data: jobs, isLoading, isError } = useQuery({ queryKey: ['public-jobs'], queryFn: fetchPublicJobs });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading font-bold text-h3 text-navy-900">Careers at TITAN</h1>
        <p className="text-body text-neutral-500">Join TAJ Institute of Technology &amp; Applied Networks — explore our open roles below.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface border border-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-6 text-center text-danger-600 text-body-sm">
          Couldn't load job openings. Please try again shortly.
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-10 text-center text-neutral-400 text-body-sm">
          There are no open positions right now. Please check back soon.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3.5">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              variants={fadeInUp}
              className="bg-surface border border-neutral-200 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap transition-all hover:-translate-y-[2px] hover:shadow-card"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="font-heading font-bold text-h6 text-neutral-900">{job.title}</div>
                <div className="text-body-sm text-neutral-500">{job.company}</div>
                <div className="flex items-center gap-2 mt-1">
                  {job.location && (
                    <span className="text-badge px-2.5 py-1 rounded-pill bg-neutral-100 text-neutral-600">{job.location}</span>
                  )}
                  <span className="text-badge px-2.5 py-1 rounded-pill bg-info-bg text-info-text">{job.type}</span>
                </div>
              </div>

              <Link
                to={`/careers/${job._id}`}
                className="shrink-0 border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600"
              >
                View &amp; Apply
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
