import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicCampaign } from '../../services/publicDonationService';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { data: campaign, isLoading, isError } = useQuery({ queryKey: ['public-campaign', id], queryFn: () => fetchPublicCampaign(id) });

  if (isLoading) {
    return <div className="h-64 bg-surface border border-neutral-200 rounded-xl animate-pulse" />;
  }

  if (isError || !campaign) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-10 text-center flex flex-col gap-3 items-center">
        <div className="text-body text-danger-600">This campaign isn't available — it may have closed.</div>
        <Link to="/donate" className="text-body-sm font-semibold text-gold-600 hover:underline">
          Back to all campaigns
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5">
      <Link to="/donate" className="text-caption font-semibold text-neutral-500 hover:text-gold-600 transition-colors w-fit">
        &larr; All campaigns
      </Link>

      <div className="bg-surface border border-neutral-200 rounded-xl p-7 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {campaign.category && (
              <span className="text-badge px-2.5 py-1 rounded-pill bg-info-bg text-info-text w-fit inline-block mb-1.5">{campaign.category}</span>
            )}
            <h1 className="font-heading font-bold text-h4 text-navy-900">{campaign.title}</h1>
          </div>
          <Link
            to={`/donate/${campaign._id}/give`}
            className="shrink-0 border-none bg-gold-500 text-white text-body font-semibold px-5 py-[11px] rounded cursor-pointer transition-colors hover:bg-gold-600"
          >
            Donate Now
          </Link>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 rounded-pill bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-pill bg-gradient-to-r from-gold-500 to-gold-600" style={{ width: `${campaign.progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-body-sm text-neutral-500">
            <span>
              <strong className="text-neutral-900">{money(campaign.raisedAmount)}</strong> raised of {money(campaign.goalAmount)}
            </span>
            <span>{campaign.donorCount} donor{campaign.donorCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        {campaign.description && (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="font-heading font-bold text-body text-neutral-900">About this campaign</div>
            <p className="text-body-sm text-neutral-600 whitespace-pre-line">{campaign.description}</p>
          </div>
        )}

        <Link
          to={`/donate/${campaign._id}/give`}
          className="mt-2 self-start border-none bg-gold-500 text-white text-body font-semibold px-5 py-[11px] rounded cursor-pointer transition-colors hover:bg-gold-600"
        >
          Donate Now
        </Link>
      </div>
    </motion.div>
  );
}
