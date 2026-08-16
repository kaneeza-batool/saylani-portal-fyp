const Slot = require('../models/Slot');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const StudentPortalQuizAttempt = require('../models/StudentPortalQuizAttempt');
const StudentPortalAssignment = require('../models/StudentPortalAssignment');
const StudentPortalAssignmentSubmission = require('../models/StudentPortalAssignmentSubmission');
const { myBatchesFilter } = require('./trainerDashboardController');

// Students in the logged-in trainer's own batches, with the same four
// metrics the roster table shows: attendance %, quiz average, latest
// assignment status, and overall grade.
exports.listMyStudents = async (req, res) => {
  try {
    const slots = await Slot.find(myBatchesFilter(req.user), '_id');
    const slotIds = slots.map((s) => s._id);
    if (slotIds.length === 0) return res.status(200).json({ items: [] });

    let batchFilterIds = slotIds;
    if (req.query.batch) {
      if (!slotIds.some((id) => String(id) === String(req.query.batch))) {
        return res.status(403).json({ message: 'You can only view students in your own batches.' });
      }
      batchFilterIds = [req.query.batch];
    }

    // Applicants (pending/rejected) were never placed in a batch and have no
    // attendance/quiz/assignment history — same exclusion as
    // studentAttendanceController.getAttendanceReports.
    const students = await Student.find({ batch: { $in: batchFilterIds }, status: { $nin: ['pending', 'rejected'] } })
      .select('name rollNumber overallGrade')
      .sort({ name: 1 })
      .lean();

    if (students.length === 0) return res.status(200).json({ items: [] });

    const studentIds = students.map((s) => s._id);

    // Attendance % — present / (present + absent), leave excluded. Same
    // formula and aggregation shape as studentAttendanceController's
    // getAttendanceSummary/getAttendanceReports, so numbers agree everywhere.
    const attendanceRows = await StudentAttendance.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: { student: '$student', status: '$status' }, count: { $sum: 1 } } },
    ]);
    const attendanceByStudent = new Map();
    for (const row of attendanceRows) {
      const sid = String(row._id.student);
      if (!attendanceByStudent.has(sid)) attendanceByStudent.set(sid, { present: 0, absent: 0, leave: 0 });
      attendanceByStudent.get(sid)[row._id.status] = row.count;
    }

    // Quiz average — mean of `percentage` across all of the student's
    // recorded attempts (any quiz, any course) via the QuizAttempt mirror.
    const quizRows = await StudentPortalQuizAttempt.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: '$student', avgPercentage: { $avg: '$percentage' }, attempts: { $sum: 1 } } },
    ]);
    const quizByStudent = new Map(quizRows.map((r) => [String(r._id), r]));

    // Assignment status — most recent submission, scoped to assignments
    // THIS trainer created (same ownership boundary as reviewSubmission).
    // A student who only submitted to a different trainer's assignment
    // reads as "not submitted" here, which is correct for this trainer's
    // own roster view.
    const myAssignmentIds = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }, '_id').lean();
    const assignmentIds = myAssignmentIds.map((a) => a._id);
    const submissions = assignmentIds.length
      ? await StudentPortalAssignmentSubmission.find({ student: { $in: studentIds }, assignment: { $in: assignmentIds } })
          .sort({ submittedAt: -1 })
          .lean()
      : [];
    const latestSubmissionByStudent = new Map();
    for (const sub of submissions) {
      const sid = String(sub.student);
      if (!latestSubmissionByStudent.has(sid)) latestSubmissionByStudent.set(sid, sub);
    }

    const items = students.map((s) => {
      const sid = String(s._id);
      const att = attendanceByStudent.get(sid) || { present: 0, absent: 0, leave: 0 };
      const denominator = att.present + att.absent;
      const attendance = denominator > 0 ? Math.round((att.present / denominator) * 1000) / 10 : null;

      const quiz = quizByStudent.get(sid);
      const quizAvg = quiz ? Math.round(quiz.avgPercentage * 10) / 10 : null;

      const latestSubmission = latestSubmissionByStudent.get(sid);

      return {
        studentId: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        attendance,
        quizAvg,
        quizAttempts: quiz?.attempts ?? 0,
        submission: latestSubmission ? latestSubmission.status : 'not_submitted',
        grade: s.overallGrade || null,
      };
    });

    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load students', error: err.message });
  }
};

exports.setStudentGrade = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { grade } = req.body;
    if (!Student.GRADE_OPTIONS.includes(grade)) {
      return res.status(400).json({ message: `grade must be one of: ${Student.GRADE_OPTIONS.join(', ')}` });
    }

    // Ownership check: a trainer can only grade students in their own
    // batches, same boundary as reviewSubmission for assignments.
    const slots = await Slot.find(myBatchesFilter(req.user), '_id');
    const slotIds = slots.map((s) => s._id);

    const student = await Student.findOneAndUpdate(
      { _id: studentId, batch: { $in: slotIds } },
      { overallGrade: grade },
      { new: true }
    ).select('name overallGrade');
    if (!student) return res.status(404).json({ message: 'Student not found in your batches' });

    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to set grade', error: err.message });
  }
};
