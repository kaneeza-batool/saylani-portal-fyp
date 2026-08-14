import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { checkDonationStatus } from '../../services/publicDonationService';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const STATUS_STYLE = {
  pending: { label: 'Pending Verification', className: 'bg-warning-bg text-warning-text' },
  confirmed: { label: 'Confirmed', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Not Confirmed', className: 'bg-danger-50 text-danger-600' },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

export default function DonationStatusPage() {
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);

  const mutation = useMutation({ mutationFn: () => checkDonationStatus(email.trim()) });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearched(true);
    mutation.mutate();
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5 max-w-[560px]">
      <div>
        <h1 className="font-heading font-bold text-h4 text-navy-900">Check Donation Status</h1>
        <p className="text-body-sm text-neutral-500 mt-1">Enter the email address you donated with to see the status of your contribution(s).</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-neutral-200 rounded-xl p-6 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status-email" className="text-caption font-semibold text-neutral-600">
            Email address
          </label>
          <input
            id="status-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border border-neutral-200 bg-surface rounded px-3 py-[10px] text-body-sm font-sans text-neutral-900 outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="self-start border-none bg-gold-500 text-white text-body-sm font-semibold px-5 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Checking...' : 'Check Status'}
        </button>
      </form>

      {searched && mutation.isSuccess && (
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-3">
          {mutation.data.length === 0 ? (
            <div className="bg-surface border border-neutral-200 rounded-xl p-6 text-center text-body-sm text-neutral-400">
              No donations found for that email.
            </div>
          ) : (
            mutation.data.map((d, i) => {
              const s = STATUS_STYLE[d.status] ?? STATUS_STYLE.pending;
              return (
                <div key={i} className="bg-surface border border-neutral-200 rounded-xl p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-heading font-bold text-body text-neutral-900">{d.campaignTitle}</div>
                    <div className="text-caption text-neutral-400">{money(d.amount)} · Donated {fmtDate(d.createdAt)}</div>
                  </div>
                  <span className={`text-badge px-2.5 py-1 rounded-pill w-fit ${s.className}`}>{s.label}</span>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {mutation.isError && (
        <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">
          Couldn't check your status right now. Please try again.
        </div>
      )}
    </motion.div>
  );
}
