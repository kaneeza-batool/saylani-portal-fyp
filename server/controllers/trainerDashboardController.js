const Slot = require('../models/Slot');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const TrainerAttendance = require('../models/TrainerAttendance');
const { computeCourseProgress } = require('../utils/courseProgress');

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
    const slotIds = slots.map((s) => s._id);

    // Explicit roster filter, not just the batch-assignment invariant
    // (pending/rejected applicants never get a batch — see Student.js) —
    // written the same way as every other student-count site so this stays
    // correct even if that invariant is ever relaxed elsewhere.
    const students = await Student.find(
      { batch: { $in: slotIds }, status: { $nin: ['pending', 'rejected'] } },
      'batch course'
    ).lean();
    const studentsBySlot = new Map();
    for (const s of students) {
      const key = String(s.batch);
      if (!studentsBySlot.has(key)) studentsBySlot.set(key, []);
      studentsBySlot.get(key).push(s);
    }

    // Real course progress per student (same formula the student sees on
    // their own Student Portal — see courseProgress.js), averaged per
    // batch. This used to be seat-fill % (students/seatsTotal), which is
    // already shown as its own "X / Y students" line on the same card —
    // pure duplication, and not what "progress" means anywhere else this
    // app shows it.
    const progressByStudentId = await computeCourseProgress(students.map((s) => ({ _id: s._id, course: s.course })));

    const batches = slots.map((slot) => {
      const slotStudents = studentsBySlot.get(String(slot._id)) || [];
      const avgProgress = slotStudents.length
        ? Math.round(
            slotStudents.reduce((sum, s) => sum + (progressByStudentId.get(String(s._id)) ?? 0), 0) / slotStudents.length
          )
        : 0;
      return {
        id: slot._id,
        course: slot.course,
        schedule: slot.schedule,
        campus: slot.campus?.name || null,
        students: slotStudents.length,
        seatsTotal: slot.seatsTotal,
        pct: avgProgress,
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
// trainerCreateController.createTrainer sets up when an admin adds a
// trainer — there's no direct User<->Trainer ref, so email is the join key.
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

// Phone/employeeId/course/city for the Profile page — none of these live on
// the User auth model, only on the standalone Trainer CRUD record, joined
// by email same as getMyAttendance above. Returns null (not a 404) when no
// Trainer record is linked (e.g. an admin created the User login directly
// without a matching Trainer profile) so the page can show an honest empty
// state instead of erroring.
exports.getMyTrainerProfile = async (req, res) => {
  try {
    const trainerProfile = await Trainer.findOne({ email: req.user.email }).select('phone employeeId course city');
    return res.status(200).json({ profile: trainerProfile });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load trainer profile', error: err.message });
  }
};
