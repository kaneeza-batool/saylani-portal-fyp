const Slot = require('../models/Slot');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const TrainerAttendance = require('../models/TrainerAttendance');

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

// Exported so trainerStudentsController can scope the roster to the exact
// same set of batches this dashboard shows — one definition of "my batches",
// not two that could drift.
exports.myBatchesFilter = myBatchesFilter;

// "Batch progress" (% of course completed) isn't tracked anywhere in the
// data model — Slot only has seat counts. The progress figure here is
// seat-fill % (studentCount/seatsTotal), which is honest data rather than a
// fabricated completion number.
//
// studentCount is a live count of Student.batch, not the stored
// Slot.seatsFilled field — that field is only ever written at slot-creation
// time and nothing updates it as students are later assigned/reassigned/
// dropped (see studentController.updateStudent), so it drifts from reality.
// Same fix/reasoning as slotRoutes.js's withStudentCounts.
exports.getMyBatches = async (req, res) => {
  try {
    const slots = await Slot.find(myBatchesFilter(req.user)).populate('campus', 'name city').sort({ createdAt: -1 });

    // Explicit roster filter, not just the batch-assignment invariant
    // (pending/rejected applicants never get a batch — see Student.js) —
    // written the same way as every other student-count site so this stays
    // correct even if that invariant is ever relaxed elsewhere.
    const counts = await Student.aggregate([
      { $match: { batch: { $in: slots.map((s) => s._id) }, status: { $nin: ['pending', 'rejected'] } } },
      { $group: { _id: '$batch', count: { $sum: 1 } } },
    ]);
    const countBySlotId = new Map(counts.map((c) => [String(c._id), c.count]));

    const batches = slots.map((slot) => {
      const students = countBySlotId.get(String(slot._id)) ?? 0;
      return {
        id: slot._id,
        course: slot.course,
        schedule: slot.schedule,
        campus: slot.campus?.name || null,
        students,
        seatsTotal: slot.seatsTotal,
        pct: slot.seatsTotal > 0 ? Math.round((students / slot.seatsTotal) * 100) : 0,
      };
    });

    return res.status(200).json({ batches });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load trainer dashboard', error: err.message });
  }
};

// The trainer's own check-in/out history (TrainerAttendance — a separate
// thing from the student rosters this controller otherwise deals with).
// Matched via email against the standalone Trainer CRUD record, same link
// authController.registerTrainer sets up when a trainer self-registers —
// there's no direct User<->Trainer ref, so email is the join key.
exports.getMyAttendance = async (req, res) => {
  try {
    const trainerProfile = await Trainer.findOne({ email: req.user.email }).select('_id');
    if (!trainerProfile) return res.status(200).json({ items: [] });

    const records = await TrainerAttendance.find({ trainer: trainerProfile._id }).sort({ date: -1 }).limit(30).lean();

    return res.status(200).json({ items: records });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance', error: err.message });
  }
};
