const Trainer = require('../models/Trainer');
const TrainerAttendance = require('../models/TrainerAttendance');

function startOfToday() {
  return new Date(new Date().toDateString());
}

exports.lookupTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ employeeId: req.params.employeeId });
    if (!trainer) return res.status(404).json({ message: 'No trainer found with that Employee ID' });

    const today = await TrainerAttendance.findOne({ trainer: trainer._id, date: startOfToday() });
    return res.status(200).json({ trainer, today });
  } catch (err) {
    return res.status(500).json({ message: 'Lookup failed', error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { employeeId, campus, schedule } = req.body;
    const trainer = await Trainer.findOne({ employeeId });
    if (!trainer) return res.status(404).json({ message: 'No trainer found with that Employee ID' });

    const existing = await TrainerAttendance.findOne({ trainer: trainer._id, date: startOfToday() });
    if (existing?.checkIn) return res.status(409).json({ message: 'Already checked in today' });

    const record = existing
      ? await TrainerAttendance.findByIdAndUpdate(existing._id, { checkIn: new Date() }, { new: true })
      : await TrainerAttendance.create({
          trainer: trainer._id,
          trainerName: trainer.name,
          employeeId: trainer.employeeId,
          campus: campus || trainer.city,
          schedule: schedule || '',
          date: startOfToday(),
          checkIn: new Date(),
        });

    return res.status(200).json({ record });
  } catch (err) {
    return res.status(500).json({ message: 'Check-in failed', error: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const trainer = await Trainer.findOne({ employeeId });
    if (!trainer) return res.status(404).json({ message: 'No trainer found with that Employee ID' });

    const existing = await TrainerAttendance.findOne({ trainer: trainer._id, date: startOfToday() });
    if (!existing || !existing.checkIn) return res.status(400).json({ message: 'No check-in found for today' });
    if (existing.checkOut) return res.status(409).json({ message: 'Already checked out today' });

    const record = await TrainerAttendance.findByIdAndUpdate(existing._id, { checkOut: new Date() }, { new: true });
    return res.status(200).json({ record });
  } catch (err) {
    return res.status(500).json({ message: 'Check-out failed', error: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search } = req.query;

    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { trainerName: new RegExp(search.trim(), 'i') },
        { employeeId: new RegExp(search.trim(), 'i') },
        { campus: new RegExp(search.trim(), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      TrainerAttendance.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TrainerAttendance.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance', error: err.message });
  }
};
