import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchDonorWall } from '../../services/publicDonationService';

const fadeInUp = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

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

export default function DonorWallPage() {
  const { data: donors, isLoading, isError } = useQuery({ queryKey: ['donor-wall'], queryFn: fetchDonorWall });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading font-bold text-h3 text-navy-900">Donor Wall</h1>
        <p className="text-body text-neutral-500">With gratitude to everyone supporting TITAN's mission.</p>
        <Link to="/donate" className="text-caption font-semibold text-gold-600 hover:underline w-fit mt-1">
          &larr; Back to campaigns
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-surface border border-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-6 text-center text-danger-600 text-body-sm">Couldn't load the donor wall.</div>
      ) : !donors || donors.length === 0 ? (
        <div className="bg-surface border border-neutral-200 rounded-xl p-10 text-center text-neutral-400 text-body-sm">
          No confirmed donations yet — be the first to give!
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
          {donors.map((d, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 last:border-b-0"
            >
              <div className="w-9 h-9 rounded-full bg-navy-800 text-gold-400 flex items-center justify-center font-heading font-bold text-caption shrink-0 border border-gold-500/40">
                {initials(d.donorName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-neutral-900 truncate">{d.donorName}</div>
                <div className="text-caption text-neutral-400 truncate">{d.campaignTitle}</div>
              </div>
              <div className="text-body-sm font-semibold text-gold-600 shrink-0">{money(d.amount)}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
