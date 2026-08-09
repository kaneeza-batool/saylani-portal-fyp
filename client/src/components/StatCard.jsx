import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/motionVariants';

const TONE_CLASS = {
  default: 'text-neutral-900',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
};

export function StatCard({ label, value, tone }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 h-full flex flex-col justify-center"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`font-heading text-2xl sm:text-3xl font-bold mt-2 ${TONE_CLASS[tone || 'default']}`}>{value}</p>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-4 sm:p-5 h-full flex flex-col justify-center animate-pulse">
      <div className="h-3 w-20 bg-neutral-200 rounded" />
      <div className="h-8 w-12 bg-neutral-200 rounded mt-3" />
    </div>
  );
}
