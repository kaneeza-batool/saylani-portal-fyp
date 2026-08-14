import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getMyFeedback } from '../services/supportFeedbackService';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { FeedbackIcon } from '../components/icons';

const TYPE_LABEL = { bug: 'Bug', idea: 'Idea', other: 'Other' };
const TYPE_EMOJI = { bug: '🐛', idea: '💡', other: '💬' };

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function RowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 sm:px-5 py-4 animate-pulse">
      <div className="w-8 h-8 rounded-pill bg-neutral-200 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/3 bg-neutral-200 rounded" />
        <div className="h-3 w-2/3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

export default function MyFeedbackPage() {
  const { data: feedback, isLoading, isError, refetch } = useQuery({
    queryKey: ['feedback', 'mine'],
    queryFn: getMyFeedback,
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
          <FeedbackIcon className="w-5 h-5 text-primary-800" />
          <h3 className="font-heading text-lg font-bold text-neutral-900">My Feedback</h3>
        </div>

        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-neutral-500">Couldn't load your feedback history.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
            >
              Retry
            </button>
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-500">
              You haven't sent any feedback yet — use the Feedback button in the top bar any time.
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col divide-y divide-neutral-100"
          >
            {feedback.map((f) => (
              <motion.div key={f._id} variants={fadeInUp} data-testid="feedback-history-item" className="flex items-start gap-3 px-4 sm:px-5 py-4">
                <span className="text-lg leading-none shrink-0 mt-0.5">{TYPE_EMOJI[f.type]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <p className="text-sm font-bold text-neutral-900">{TYPE_LABEL[f.type]}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-info-text bg-info-bg rounded-pill px-1.5 py-0.5">
                      {f.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">{f.text}</p>
                  {f.imageUrl && (
                    <img
                      src={f.imageUrl}
                      alt="Attachment"
                      className="w-16 h-16 object-cover rounded-md border border-neutral-200 mt-2"
                    />
                  )}
                  <p className="text-xs text-neutral-400 mt-1.5">{formatTimestamp(f.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
