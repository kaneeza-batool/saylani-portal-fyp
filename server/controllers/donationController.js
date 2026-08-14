const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const { logAudit } = require('../utils/auditLogger');
const { sendMail } = require('../utils/mailer');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getDonations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status, campaign } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (campaign && campaign !== 'all') filter.campaign = campaign;
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ donorName: re }, { email: re }, { campaignTitle: re }];
    }

    const [items, total] = await Promise.all([
      Donation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Donation.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donations', error: err.message });
  }
};

exports.getDonation = async (req, res) => {
  try {
    const item = await Donation.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donation', error: err.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const item = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Donation',
      resourceId: item._id,
      summary: `Marked donation from "${item.donorName}" for "${item.campaignTitle}" as ${status}`,
    });

    const STATUS_COPY = {
      pending: { label: 'Pending', tone: '#B7791F', line: 'Your donation is pending verification.' },
      confirmed: { label: 'Confirmed', tone: '#1B6B45', line: 'Thank you — your generous contribution has been confirmed and applied to the campaign.' },
      rejected: { label: 'Not Confirmed', tone: '#C0392B', line: "We couldn't verify this transaction. Please contact us if you believe this is an error." },
    };
    const copy = STATUS_COPY[status];
    sendMail({
      to: item.email,
      subject: `TITAN — Update on your donation to ${item.campaignTitle}`,
      html: `<div style="font-family:sans-serif;padding:16px">
        <h2 style="color:#12234A;margin:0 0 8px">Donation Status Update</h2>
        <p style="color:#333;margin:0 0 6px">Hi ${item.donorName},</p>
        <p style="color:${copy.tone};font-weight:600;text-transform:uppercase;font-size:12px;margin:0 0 6px">${copy.label}</p>
        <p style="color:#333;margin:0">${copy.line}</p>
      </div>`,
    });

    return res.status(200).json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update donation', error: err.message });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const item = await Donation.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'Donation',
      resourceId: item._id,
      summary: `Deleted donation from "${item.donorName}" for "${item.campaignTitle}"`,
    });

    return res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete donation', error: err.message });
  }
};

exports.getCampaignOptions = async (req, res) => {
  try {
    const campaigns = await Campaign.find({}, 'title').sort({ title: 1 });
    return res.status(200).json({ items: campaigns });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campaigns', error: err.message });
  }
};

exports.getCampaignSummary = async (req, res) => {
  try {
    const rows = await Donation.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$campaign', raisedAmount: { $sum: '$amount' }, donorCount: { $sum: 1 } } },
    ]);
    const summary = {};
    for (const row of rows) summary[row._id.toString()] = { raisedAmount: row.raisedAmount, donorCount: row.donorCount };
    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campaign summary', error: err.message });
  }
};
