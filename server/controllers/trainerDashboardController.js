const Slot = require('../models/Slot');

// Matches a Slot to the logged-in trainer two ways: the real link
// (assignedTrainer, set when a slot is created/edited with this trainer's
// account explicitly picked) OR a name match against the existing
// free-text `trainer` field admins already fill in on the Slots page.
// The name-match half means this works immediately against real data —
// batches admins already created — without requiring a trainer-picker UI
// change first. assignedTrainer is the precise, preferred match; name is
// the pragmatic fallback for everything that predates it.
function myBatchesFilter(user) {
  return {
    status: 'active',
    $or: [{ assignedTrainer: user._id }, { trainer: { $regex: `^${escapeRegex(user.name.trim())}$`, $options: 'i' } }],
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "Batch progress" (% of course completed) isn't tracked anywhere in the
// data model — Slot only has seat counts. The progress figure here is
// seat-fill % (seatsFilled/seatsTotal), which is honest data rather than a
// fabricated completion number.
exports.getMyBatches = async (req, res) => {
  try {
    const slots = await Slot.find(myBatchesFilter(req.user)).populate('campus', 'name city').sort({ createdAt: -1 });

    const batches = slots.map((slot) => ({
      id: slot._id,
      course: slot.course,
      schedule: slot.schedule,
      campus: slot.campus?.name || null,
      students: slot.seatsFilled,
      seatsTotal: slot.seatsTotal,
      pct: slot.seatsTotal > 0 ? Math.round((slot.seatsFilled / slot.seatsTotal) * 100) : 0,
    }));

    return res.status(200).json({ batches });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load trainer dashboard', error: err.message });
  }
};
