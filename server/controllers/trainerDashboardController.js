const Slot = require('../models/Slot');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const StudentPortalAssignment = require('../models/StudentPortalAssignment');
const StudentPortalAssignmentSubmission = require('../models/StudentPortalAssignmentSubmission');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// present/(present+absent), same convention as dashboardController.js's
// own attendanceRate — 'leave' excluded from the denominator, null (not 0)
// when there's no data at all so "no attendance recorded" isn't shown as
// a real 0%.
function attendanceRate(rows) {
  const counts = { present: 0, absent: 0 };
  for (const r of rows) {
    if (r._id in counts) counts[r._id] = r.count;
  }
  const denom = counts.present + counts.absent;
  return denom > 0 ? Math.round((counts.present / denom) * 1000) / 10 : null;
}

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

    const counts = await Student.aggregate([
      { $match: { batch: { $in: slots.map((s) => s._id) } } },
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

// Real per-student stats, not fabricated ones — 30-day attendance rate
// (same present/(present+absent) convention as the Super Admin dashboard)
// and assignment completion (submitted-or-decided out of everything this
// trainer has assigned in this course), computed live from the same
// collections the rest of the Trainer Portal already writes to.
exports.listMyStudents = async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) return res.status(400).json({ message: 'course is required.' });

    const [currentlyEnrolled, myAssignments] = await Promise.all([
      Student.find({ course, status: { $in: ['enrolled', 'completed'] } }, 'name rollNumber').lean(),
      StudentPortalAssignment.find({ createdByTrainer: req.user._id, course }, '_id').lean(),
    ]);

    const assignmentIds = myAssignments.map((a) => a._id);

    // Union with anyone who has a real submission here but isn't currently
    // enrolled (e.g. since dropped out) — same fix as
    // trainerAssignmentController.getAssignmentRoster, for the same
    // reason: a student's real activity shouldn't just disappear because
    // their status changed later.
    const pastSubmitterIds = assignmentIds.length
      ? (await StudentPortalAssignmentSubmission.find({ assignment: { $in: assignmentIds } }, 'student').lean()).map((s) =>
          String(s.student)
        )
      : [];
    const missingIds = [...new Set(pastSubmitterIds)].filter((id) => !currentlyEnrolled.some((s) => String(s._id) === id));
    const pastSubmitters = missingIds.length ? await Student.find({ _id: { $in: missingIds } }, 'name rollNumber').lean() : [];

    const students = [...currentlyEnrolled, ...pastSubmitters].sort((a, b) => a.name.localeCompare(b.name));
    const since30d = daysAgo(30);

    const results = await Promise.all(
      students.map(async (student) => {
        const [attRows, submissionCount] = await Promise.all([
          StudentAttendance.aggregate([
            { $match: { student: student._id, date: { $gte: since30d } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          assignmentIds.length
            ? StudentPortalAssignmentSubmission.countDocuments({ student: student._id, assignment: { $in: assignmentIds } })
            : Promise.resolve(0),
        ]);

        return {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          attendancePct: attendanceRate(attRows),
          assignmentsSubmitted: submissionCount,
          assignmentsTotal: assignmentIds.length,
        };
      })
    );

    return res.status(200).json({ items: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load students', error: err.message });
  }
};
