const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const { computeOverallProgress, computeAttendanceStat, computeQuizAverage } = require('../utils/courseStats');

// Short course codes for readable certificate IDs — falls back to an
// acronym of the course name for any course not explicitly listed here, so
// this never blocks generation for a future course.
const COURSE_CODES = {
  'Web Development': 'WD',
  'AI & Data Science': 'AIDS',
};

function courseCode(courseName) {
  if (COURSE_CODES[courseName]) return COURSE_CODES[courseName];
  return courseName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
}

async function generateCertificateId(courseName, issueDate) {
  const prefix = `TITAN-${courseCode(courseName)}-${issueDate.getFullYear()}-`;
  const count = await Certificate.countDocuments({ certificateId: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
}

// Tamper-evident hash — recomputed from the certificate's OWN stored fields
// on every verify request (see verifyCertificate below) and compared
// against the value saved at issuance. Any direct DB edit to the id,
// student, course, or issue date breaks the match. `course` is now the
// plain name string (see Certificate.js), not an Enrollment/Course ObjectId.
function computeVerificationHash({ certificateId, studentId, course, issueDate }) {
  const payload = `${certificateId}|${studentId}|${course}|${new Date(issueDate).toISOString()}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Simple weighted grade — quiz performance counts more than attendance,
// since 100% course progress (the eligibility gate itself) already proves
// attendance/participation to some degree.
function computeFinalGrade(attendancePercent, quizAverage) {
  const overall = attendancePercent * 0.4 + quizAverage * 0.6;
  if (overall >= 90) return 'A+';
  if (overall >= 80) return 'A';
  if (overall >= 70) return 'B';
  if (overall >= 60) return 'C';
  return 'D';
}

// Auto-generates the Certificate the first time a student's course Progress
// reaches 100% — no admin action, since there's no admin-portal connection
// to this app yet. Idempotent: a second call for the same student returns
// the same record rather than minting a new one (enforced by the unique
// `student` index on the model too — one course per student now, so one
// certificate per student is the right invariant, not one per student+course).
async function getOrCreateCertificate(student, course) {
  let certificate = await Certificate.findOne({ student: student._id });
  if (certificate) return certificate;

  const [attendance, quizAverage] = await Promise.all([
    computeAttendanceStat(student._id, course),
    computeQuizAverage(student._id, course),
  ]);

  const issueDate = new Date();
  const certificateId = await generateCertificateId(course, issueDate);
  const finalGrade = computeFinalGrade(attendance.percentage, quizAverage);
  const verificationHash = computeVerificationHash({
    certificateId,
    studentId: student._id,
    course,
    issueDate,
  });

  try {
    certificate = await Certificate.create({
      student: student._id,
      course,
      certificateId,
      issueDate,
      verificationHash,
      finalGrade,
      attendancePercent: attendance.percentage,
      quizAverage,
    });
  } catch (err) {
    // Duplicate-key race (two near-simultaneous requests both found "no
    // certificate yet") — whichever lost the race just reads the winner's.
    if (err.code === 11000) return Certificate.findOne({ student: student._id });
    throw err;
  }

  return certificate;
}

function toOwnerView(certificate, studentName, student) {
  return {
    certificateId: certificate.certificateId,
    studentName,
    courseName: certificate.course,
    batch: student.batch?.schedule || null,
    campus: student.campus?.name || null,
    issueDate: certificate.issueDate,
    finalGrade: certificate.finalGrade,
    attendancePercent: certificate.attendancePercent,
    quizAverage: certificate.quizAverage,
    verifyUrl: `${process.env.CLIENT_URL}/verify/${certificate.certificateId}`,
  };
}

// Drives the Certificate Ready banner on Dashboard/Progress. One course per
// student now, so this is a single eligibility check, not a loop over
// Enrollment records — that loop always iterated zero times in production
// since Enrollment is never populated for a real student.
exports.getEligibleCertificates = async (req, res) => {
  try {
    const course = req.student.course;
    if (!course) return res.status(200).json({ certificates: [] });

    const { percentage } = await computeOverallProgress(req.student._id, course);
    if (percentage < 100) {
      return res.status(200).json({ certificates: [{ courseName: course, eligible: false, percentage }] });
    }

    const certificate = await getOrCreateCertificate(req.student, course);
    return res.status(200).json({
      certificates: [{ courseName: course, eligible: true, percentage, certificateId: certificate.certificateId }],
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load certificate eligibility', error: err.message });
  }
};

// Used by the Certificate page (/certificate) — checks eligibility for the
// student's one course and returns (auto-generating if needed) the full
// owner-view certificate.
exports.getCertificate = async (req, res) => {
  try {
    const course = req.student.course;
    if (!course) return res.status(404).json({ message: 'No course on file for this account.' });

    // campus is already populated by authMiddleware.protect() on every
    // request — only batch needs populating here.
    await req.student.populate({ path: 'batch', select: 'schedule' });

    const { percentage } = await computeOverallProgress(req.student._id, course);
    if (percentage < 100) return res.status(200).json({ eligible: false, percentage });

    const certificate = await getOrCreateCertificate(req.student, course);
    const view = toOwnerView(certificate, req.student.name, req.student);

    return res.status(200).json({ eligible: true, certificate: view });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load certificate', error: err.message });
  }
};

// Owner-scoped lookup by certificateId — for re-opening a certificate
// directly (e.g. a bookmarked link) without recomputing eligibility from
// scratch.
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId }).populate(
      'student',
      'name'
    );

    if (!certificate || certificate.student._id.toString() !== req.student._id.toString()) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // campus is already populated by authMiddleware.protect() on every
    // request — only batch needs populating here.
    await req.student.populate({ path: 'batch', select: 'schedule' });
    const view = toOwnerView(certificate, certificate.student.name, req.student);

    return res.status(200).json({ certificate: view });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load certificate', error: err.message });
  }
};

// PUBLIC — no auth. Anyone with the link (e.g. an employer) re-derives the
// hash from the certificate's own stored fields and compares it against
// what was saved at issuance, rather than just trusting the record exists.
exports.verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId }).populate(
      'student',
      'name'
    );

    if (!certificate) return res.status(200).json({ valid: false, reason: 'not_found' });

    const expectedHash = computeVerificationHash({
      certificateId: certificate.certificateId,
      studentId: certificate.student._id,
      course: certificate.course,
      issueDate: certificate.issueDate,
    });

    if (expectedHash !== certificate.verificationHash) {
      return res.status(200).json({ valid: false, reason: 'tampered' });
    }

    return res.status(200).json({
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.student.name,
        courseName: certificate.course,
        issueDate: certificate.issueDate,
        finalGrade: certificate.finalGrade,
        attendancePercent: certificate.attendancePercent,
        quizAverage: certificate.quizAverage,
      },
    });
  } catch (err) {
    return res.status(500).json({ valid: false, reason: 'error', message: err.message });
  }
};
