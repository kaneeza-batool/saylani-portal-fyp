const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const { computeProgressStat, computeAttendanceStat, computeQuizAverage } = require('../utils/courseStats');

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
// student, course, or issue date breaks the match.
function computeVerificationHash({ certificateId, studentId, courseId, issueDate }) {
  const payload = `${certificateId}|${studentId}|${courseId}|${new Date(issueDate).toISOString()}`;
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

// Auto-generates the Certificate the first time a student's course
// Progress reaches 100% — no admin action, since there's no admin-portal
// connection to this app yet. Idempotent: a second call for the same
// student+course returns the same record rather than minting a new one
// (enforced by the unique student+course index on the model too).
async function getOrCreateCertificate(student, courseId, courseName) {
  let certificate = await Certificate.findOne({ student: student._id, course: courseId });
  if (certificate) return certificate;

  const [attendance, quizAverage] = await Promise.all([
    computeAttendanceStat(student._id, courseId),
    computeQuizAverage(student._id, courseId),
  ]);

  const issueDate = new Date();
  const certificateId = await generateCertificateId(courseName, issueDate);
  const finalGrade = computeFinalGrade(attendance.percentage, quizAverage);
  const verificationHash = computeVerificationHash({
    certificateId,
    studentId: student._id,
    courseId,
    issueDate,
  });

  try {
    certificate = await Certificate.create({
      student: student._id,
      course: courseId,
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
    if (err.code === 11000) return Certificate.findOne({ student: student._id, course: courseId });
    throw err;
  }

  return certificate;
}

async function toOwnerView(certificate, studentName, courseName, enrollment) {
  return {
    certificateId: certificate.certificateId,
    studentName,
    courseName,
    batch: enrollment?.batch || null,
    campus: enrollment?.campus || null,
    issueDate: certificate.issueDate,
    finalGrade: certificate.finalGrade,
    attendancePercent: certificate.attendancePercent,
    quizAverage: certificate.quizAverage,
    verifyUrl: `${process.env.CLIENT_URL}/verify/${certificate.certificateId}`,
  };
}

// Every enrolled course, flagged eligible once Progress hits 100% —
// auto-generates a certificate for any newly-eligible course found. Drives
// the "Certificate" tab/button visibility on Progress/Dashboard.
exports.getEligibleCertificates = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.student._id }).populate('course', 'name');

    const results = await Promise.all(
      enrollments
        .filter((e) => e.course)
        .map(async (enrollment) => {
          const { percentage } = await computeProgressStat(req.student._id, enrollment.course._id);
          if (percentage < 100) {
            return { courseId: enrollment.course._id, courseName: enrollment.course.name, eligible: false, percentage };
          }
          const certificate = await getOrCreateCertificate(req.student, enrollment.course._id, enrollment.course.name);
          return {
            courseId: enrollment.course._id,
            courseName: enrollment.course.name,
            eligible: true,
            percentage,
            certificateId: certificate.certificateId,
          };
        })
    );

    return res.status(200).json({ certificates: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load certificate eligibility', error: err.message });
  }
};

// Used by the Certificate page itself (/certificate/:courseId) — checks
// eligibility for THIS course specifically and returns (auto-generating if
// needed) the full owner-view certificate.
exports.getCertificateForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({ student: req.student._id, course: courseId }).populate(
      'course',
      'name'
    );
    if (!enrollment || !enrollment.course) return res.status(404).json({ message: 'Not enrolled in this course' });

    const { percentage } = await computeProgressStat(req.student._id, courseId);
    if (percentage < 100) return res.status(200).json({ eligible: false, percentage });

    const certificate = await getOrCreateCertificate(req.student, courseId, enrollment.course.name);
    const view = await toOwnerView(certificate, req.student.name, enrollment.course.name, enrollment);

    return res.status(200).json({ eligible: true, certificate: view });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load certificate', error: err.message });
  }
};

// Owner-scoped lookup by certificateId — for re-opening a certificate
// directly (e.g. a bookmarked /certificate link) without recomputing
// eligibility from scratch.
exports.getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name')
      .populate('course', 'name');

    if (!certificate || certificate.student._id.toString() !== req.student._id.toString()) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const enrollment = await Enrollment.findOne({ student: certificate.student._id, course: certificate.course._id });
    const view = await toOwnerView(certificate, certificate.student.name, certificate.course.name, enrollment);

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
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name')
      .populate('course', 'name');

    if (!certificate) return res.status(200).json({ valid: false, reason: 'not_found' });

    const expectedHash = computeVerificationHash({
      certificateId: certificate.certificateId,
      studentId: certificate.student._id,
      courseId: certificate.course._id,
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
        courseName: certificate.course.name,
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
