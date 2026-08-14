const mongoose = require('mongoose');

// A donation drive (e.g. "Scholarship Fund", "New Lab Equipment") — distinct
// from `Campus` (a physical location). `raisedAmount` is intentionally not
// stored here; it's computed on read from confirmed Donations so it can
// never drift out of sync with the actual ledger.
const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    goalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
