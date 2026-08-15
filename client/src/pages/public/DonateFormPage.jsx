import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchPublicCampaign, submitDonation } from '../../services/publicDonationService';
import CardPaymentForm from '../../components/CardPaymentForm';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const EMPTY_FORM = { donorName: '', email: '', phone: '', amount: '', paymentMethod: 'Bank Transfer', message: '', anonymous: false };

const inputClass =
  'border border-neutral-200 bg-surface rounded px-3 py-[10px] text-body-sm font-sans text-neutral-900 outline-none focus:border-gold-500 transition-colors';
const labelClass = 'text-caption font-semibold text-neutral-600';

export default function DonateFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';
  const { data: campaign, isLoading: campaignLoading } = useQuery({ queryKey: ['public-campaign', id], queryFn: () => fetchPublicCampaign(id) });

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [showCardStep, setShowCardStep] = useState(false);

  const isCard = form.paymentMethod === 'Credit/Debit Card';
  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const donateMutation = useMutation({
    mutationFn: () => submitDonation(id, form),
    onError: (err) => setError(err.response?.data?.message || 'Something went wrong submitting your donation.'),
  });

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isCard) setShowCardStep(true);
    else donateMutation.mutate();
  };

  if (donateMutation.isSuccess) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-surface border border-neutral-200 rounded-xl p-10 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-success-bg text-success-text flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="font-heading font-bold text-h5 text-neutral-900">Thank you for your generosity!</div>
        <p className="text-body-sm text-neutral-500 max-w-[420px]">
          {isCard ? (
            <>Your donation of Rs. {Number(form.amount).toLocaleString()} to <strong>{campaign?.title}</strong> has been confirmed. A receipt is on its way.</>
          ) : (
            <>We've recorded your pledge to <strong>{campaign?.title}</strong>. Our team will verify the transaction and confirm it shortly — a confirmation email is on its way.</>
          )}
        </p>
        <Link to="/donate" className="mt-2 text-body-sm font-semibold text-gold-600 hover:underline">
          Back to all campaigns
        </Link>
      </motion.div>
    );
  }

  if (showCardStep) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5 max-w-[720px]">
        <h1 className="font-heading font-bold text-h4 text-navy-900">Complete Your Payment</h1>
        <CardPaymentForm
          amount={form.amount}
          campaignTitle={campaign?.title}
          contact={{ donorName: form.donorName, email: form.email, phone: form.phone }}
          onBack={() => setShowCardStep(false)}
          onSubmit={() => donateMutation.mutate()}
          submitting={donateMutation.isPending}
          submitError={error}
        />
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="flex flex-col gap-5 max-w-[560px]">
      <Link to={`/donate/${id}`} className="text-caption font-semibold text-neutral-500 hover:text-gold-600 transition-colors w-fit">
        &larr; Back to campaign
      </Link>

      <div>
        <h1 className="font-heading font-bold text-h4 text-navy-900">Donate{campaign ? ` — ${campaign.title}` : ''}</h1>
        {!campaignLoading && campaign && <p className="text-body-sm text-neutral-500 mt-1">Every contribution moves this campaign closer to its goal.</p>}
      </div>

      {cancelled && (
        <div className="text-caption text-warning-text bg-warning-bg border border-warning-text/20 rounded px-3 py-2">
          Your card payment was cancelled. You can try again or choose a different payment method below.
        </div>
      )}

      <form onSubmit={handleDetailsSubmit} className="bg-surface border border-neutral-200 rounded-xl p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="donorName">Full name</label>
            <input id="donorName" type="text" required value={form.donorName} onChange={setField('donorName')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={setField('email')} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="phone">Phone</label>
            <input id="phone" type="tel" required value={form.phone} onChange={setField('phone')} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="amount">Amount (Rs.)</label>
            <input id="amount" type="number" min="1" required value={form.amount} onChange={setField('amount')} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="paymentMethod">Payment method</label>
          <select id="paymentMethod" value={form.paymentMethod} onChange={setField('paymentMethod')} className={`${inputClass} bg-surface`}>
            <option>Bank Transfer</option>
            <option>Easypaisa</option>
            <option>JazzCash</option>
            <option>Credit/Debit Card</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="message">Message (optional)</label>
          <textarea id="message" rows={3} value={form.message} onChange={setField('message')} placeholder="A note to accompany your gift" className={inputClass} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(e) => setForm((f) => ({ ...f, anonymous: e.target.checked }))}
            className="w-4 h-4 accent-gold-500 cursor-pointer"
          />
          <span className="text-body-sm text-neutral-700">Keep my name off the public donor wall</span>
        </label>

        {isCard ? (
          <div className="text-caption text-neutral-400 bg-neutral-50 border border-neutral-200 rounded px-3 py-2">
            You'll enter your card details on the next step.
          </div>
        ) : (
          <div className="text-caption text-neutral-400 bg-neutral-50 border border-neutral-200 rounded px-3 py-2">
            After submitting, please complete the transfer via your selected method — our team will confirm it against your donation.
          </div>
        )}

        {error && <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{error}</div>}

        <button
          type="submit"
          disabled={donateMutation.isPending}
          className="mt-1 border-none bg-gold-500 text-white text-body font-semibold px-5 py-[11px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {donateMutation.isPending ? 'Submitting...' : isCard ? 'Continue to Payment' : 'Submit Pledge'}
        </button>
      </form>
    </motion.div>
  );
}
