import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchPublicCampaigns } from '../../services/publicDonationService';

const fadeInUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

export default function DonatePage() {
  const { data: campaigns, isLoading, isError } = useQuery({ queryKey: ['public-campaigns'], queryFn: fetchPublicCampaigns });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading font-bold text-h3 text-navy-900">Support TITAN</h1>
        <p className="text-body text-neutral-500">
          Your contribution helps TAJ Institute of Technology &amp; Applied Networks fund scholarships, equipment, and campus growth.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-surface border border-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-6 text-center text-danger-600 text-body-sm">
          Couldn't load campaigns. Please try again shortly.
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-10 text-center text-neutral-400 text-body-sm">
          There are no active campaigns right now. Please check back soon.
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <motion.div
              key={c._id}
              variants={fadeInUp}
              className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-[2px] hover:shadow-card"
            >
              <div>
                {c.category && (
                  <span className="text-badge px-2.5 py-1 rounded-pill bg-info-bg text-info-text w-fit inline-block mb-1.5">{c.category}</span>
                )}
                <div className="font-heading font-bold text-h6 text-neutral-900">{c.title}</div>
                <p className="text-body-sm text-neutral-500 mt-1 line-clamp-2">{c.description}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="h-2 rounded-pill bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-pill bg-gradient-to-r from-gold-500 to-gold-600" style={{ width: `${c.progressPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-caption text-neutral-500">
                  <span>
                    <strong className="text-neutral-900">{money(c.raisedAmount)}</strong> raised
                  </span>
                  <span>of {money(c.goalAmount)}</span>
                </div>
              </div>

              <Link
                to={`/donate/${c._id}`}
                className="mt-1 self-start border-none bg-gold-500 text-white text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600"
              >
                Donate Now
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
