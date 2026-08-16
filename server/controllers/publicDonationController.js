const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const { sendMail } = require('../utils/mailer');

function sendDonationThanksEmail(donation, campaign) {
  const confirmed = donation.status === 'confirmed';
  sendMail({
    to: donation.email,
    subject: confirmed
      ? `TITAN — Your donation to ${campaign.title} is confirmed`
      : `TITAN — Thank you for your donation to ${campaign.title}`,
    html: `<div style="font-family:sans-serif;padding:16px">
      <h2 style="color:#12234A;margin:0 0 8px">Thank You, ${donation.donorName}!</h2>
      <p style="color:#333;margin:0 0 6px">We've received your ${confirmed ? 'donation' : 'pledge'} of <strong>Rs. ${Number(donation.amount).toLocaleString()}</strong> via ${donation.paymentMethod} for <strong>${campaign.title}</strong>.</p>
      <p style="color:#666;font-size:13px;margin:12px 0 0">${
        confirmed
          ? 'Your donation has been confirmed — thank you for your generosity.'
          : "Our team will verify the transaction and confirm your donation shortly. You can check its status anytime on the Donate page's status checker using this email address."
      }</p>
    </div>`,
  });
}

async function raisedMap(campaignIds) {
  const rows = await Donation.aggregate([
    { $match: { status: 'confirmed', campaign: { $in: campaignIds } } },
    { $group: { _id: '$campaign', raisedAmount: { $sum: '$amount' }, donorCount: { $sum: 1 } } },
  ]);
  const map = {};
  for (const row of rows) map[row._id.toString()] = { raisedAmount: row.raisedAmount, donorCount: row.donorCount };
  return map;
}

function withProgress(campaign, raised) {
  const info = raised[campaign._id.toString()] || { raisedAmount: 0, donorCount: 0 };
  const pct = campaign.goalAmount > 0 ? Math.min(100, Math.round((info.raisedAmount / campaign.goalAmount) * 100)) : 0;
  return { ...campaign.toObject(), raisedAmount: info.raisedAmount, donorCount: info.donorCount, progressPct: pct };
}

exports.listPublicCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ published: true, status: 'active' }).sort({ createdAt: -1 });
    const raised = await raisedMap(campaigns.map((c) => c._id));
    return res.status(200).json({ items: campaigns.map((c) => withProgress(c, raised)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campaigns', error: err.message });
  }
};

exports.getPublicCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, published: true, status: 'active' });
    if (!campaign) return res.status(404).json({ message: 'This campaign is not available.' });
    const raised = await raisedMap([campaign._id]);
    return res.status(200).json({ item: withProgress(campaign, raised) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campaign', error: err.message });
  }
};

exports.submitDonation = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, published: true, status: 'active' });
    if (!campaign) return res.status(404).json({ message: 'This campaign is no longer accepting donations.' });

    const { donorName, email, phone, amount, paymentMethod, message, anonymous } = req.body;
    if (!donorName || !email || !phone || !amount) {
      return res.status(400).json({ message: 'Name, email, phone, and amount are required.' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    // No real payment gateway is wired up for any method, card included —
    // a card "charge" here is only a client-side Luhn/expiry check (see
    // CardPaymentForm.jsx), not an actual transaction. So every method
    // starts pending and only a super-admin's manual confirm (donationController.js)
    // moves it to confirmed, same reconciliation model Bank Transfer/
    // Easypaisa/JazzCash already use — previously card was auto-confirmed
    // instantly, which meant any Luhn-valid card number became a real
    // public "confirmed" donation with no money ever moving.
    const donation = await Donation.create({
      campaign: campaign._id,
      campaignTitle: campaign.title,
      donorName,
      email,
      phone,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Bank Transfer',
      message: message || '',
      anonymous: !!anonymous,
      status: 'pending',
    });

    sendDonationThanksEmail(donation, campaign);

    return res.status(201).json({ item: donation });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit donation', error: err.message });
  }
};

exports.checkDonationStatus = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter the email you donated with.' });
    }
    const donations = await Donation.find({ email: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .select('campaignTitle amount status createdAt');
    return res.status(200).json({ items: donations });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check donation status', error: err.message });
  }
};

exports.getDonorWall = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'confirmed', anonymous: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('donorName amount campaignTitle createdAt');
    return res.status(200).json({ items: donations });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donor wall', error: err.message });
  }
};
