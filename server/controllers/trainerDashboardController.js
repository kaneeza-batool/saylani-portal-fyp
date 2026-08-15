const Slot = require('../models/Slot');

// "Batch progress" (% of course completed) isn't tracked anywhere in the
// data model — Slot only has seat counts. Given the time constraint, the
// progress ring is repurposed to show seat-fill % (seatsFilled/seatsTotal)
// instead, which is honest data rather than a fabricated completion number.
exports.getMyBatches = async (req, res) => {
  try {
    const slots = await Slot.find({ assignedTrainer: req.user._id, status: 'active' }).sort({ createdAt: -1 });

    const batches = slots.map((slot) => ({
      id: slot._id,
      course: slot.course,
      schedule: slot.schedule,
      campus: slot.campus,
      students: slot.seatsFilled,
      seatsTotal: slot.seatsTotal,
      pct: slot.seatsTotal > 0 ? Math.round((slot.seatsFilled / slot.seatsTotal) * 100) : 0,
    }));

    return res.status(200).json({ batches });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load trainer dashboard', error: err.message });
  }
};
