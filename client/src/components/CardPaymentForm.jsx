import { useState } from 'react';
import { motion } from 'framer-motion';

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

const fieldClass =
  'border border-neutral-200 rounded px-3 py-[10px] bg-white text-body-sm font-sans text-neutral-900 outline-none focus:border-gold-500 transition-colors';

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function CardBrandIcons() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2.5">
        <div className="w-6 h-6 rounded-full bg-[#EB001B]" />
        <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90" />
      </div>
      <span className="font-heading font-bold text-[13px] italic text-[#1A1F71]">VISA</span>
    </div>
  );
}

// Standard Luhn checksum — same check a real card processor runs before
// even looking at whether the card exists, so this rejects obviously-fake
// numbers instead of accepting literally any digit string.
function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCard({ cardNumber, expiry, cvv }) {
  const digits = cardNumber.replace(/\s/g, '');
  if (!luhnValid(digits)) return 'Enter a valid card number.';

  const [mm, yy] = expiry.split('/');
  const month = Number(mm);
  const year = Number(yy);
  if (!mm || !yy || month < 1 || month > 12 || yy.length !== 2) return 'Enter a valid expiry date (MM/YY).';
  const expiryDate = new Date(2000 + year, month); // first of the month after expiry
  if (expiryDate < new Date()) return 'This card has expired.';

  if (!/^\d{3,4}$/.test(cvv)) return 'Enter a valid CVV.';

  return '';
}

export default function CardPaymentForm({ amount, campaignTitle, contact, onBack, onSubmit, submitting, submitError }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validateCard({ cardNumber, expiry, cvv });
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    onSubmit();
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="show" className="bg-white border border-neutral-200 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="font-heading font-bold text-body text-neutral-900">Payment</div>
          <CardBrandIcons />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-caption font-semibold text-neutral-600" htmlFor="cardNumber">Card Number</label>
          <input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-neutral-600" htmlFor="expiry">Expiration Date</label>
            <input
              id="expiry"
              type="text"
              inputMode="numeric"
              required
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-neutral-600" htmlFor="cvv">CVV</label>
            <input
              id="cvv"
              type="text"
              inputMode="numeric"
              required
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className={fieldClass}
            />
          </div>
        </div>

        {(validationError || submitError) && (
          <div className="text-caption text-danger-600 bg-danger-50 border border-danger-200 rounded px-3 py-2">{validationError || submitError}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 border-none bg-gold-500 text-white text-body font-semibold px-5 py-[12px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Processing...' : `Pay ${money(amount)}`}
        </button>

        <p className="text-micro text-neutral-400 leading-relaxed">
          No real payment gateway is connected — this is a simulated charge for demo purposes. Card details are validated locally and never sent
          to or stored on our servers.
        </p>
      </form>

      <div className="p-6 flex flex-col gap-5 bg-neutral-50">
        <div>
          <div className="font-heading font-bold text-body text-neutral-900 mb-2">Contact Details</div>
          <div className="flex flex-col gap-1 text-body-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Full Name</span><span className="text-neutral-900 font-medium">{contact.donorName}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="text-neutral-900 font-medium">{contact.email}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Mobile</span><span className="text-neutral-900 font-medium">{contact.phone}</span></div>
          </div>
          <button type="button" onClick={onBack} className="text-caption font-semibold text-gold-600 hover:underline mt-2 cursor-pointer bg-transparent border-none p-0">
            Not you? Go back and edit
          </button>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="font-heading font-bold text-body text-neutral-900 mb-2">Order Summary</div>
          <div className="flex justify-between text-body-sm mb-1">
            <span className="text-neutral-600">{campaignTitle}</span>
            <span className="text-neutral-900">{money(amount)}</span>
          </div>
          <div className="flex justify-between text-body font-bold border-t border-neutral-200 pt-2 mt-2">
            <span className="text-neutral-900">Total</span>
            <span className="text-gold-600">{money(amount)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
