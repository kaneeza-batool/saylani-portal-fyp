const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    campaignTitle: { type: String, required: true }, // cached for display without a populate
    donorName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Easypaisa', 'JazzCash', 'Credit/Debit Card'],
      default: 'Bank Transfer',
    },
    message: { type: String, default: '', trim: true },
    // Donor opts out of appearing on the public donor wall by name.
    anonymous: { type: Boolean, default: false },
    // No real payment gateway is wired up for ANY method (card included —
    // CardPaymentForm.jsx only runs a client-side Luhn/expiry check, never
    // an actual charge) — every donation starts `pending` and an admin
    // manually marks it `confirmed` once the transfer/charge is verified
    // (mirrors how a real institute would reconcile bank/mobile-wallet/
    // card transfers by hand), or `rejected` if it can't be verified.
    status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
