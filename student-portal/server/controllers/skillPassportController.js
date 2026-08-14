const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
require('../models/Course');
const { computeProgressStat } = require('../utils/courseStats');

// Hardcoded per-course skill mapping — there's no curriculum/tagging system
// to derive this from yet, so this is a reasonable stand-in until courses
// carry their own structured skill/topic tags. Falls back to the course's
// category string as a single skill if a course isn't explicitly listed,
// so a future course never contributes zero skills silently.
const SKILL_MAP = {
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'Git & GitHub'],
  'AI & Data Science': ['Python', 'Machine Learning', 'Data Analysis', 'Deep Learning', 'SQL', 'Statistics'],
};

function skillsForCourse(course) {
  return SKILL_MAP[course.name] || (course.category ? [course.category] : []);
}

// Lifetime, cross-course view — NOT scoped to whichever course is active,
// unlike every other page in this portal. Structured with a flat
// courses[]/skills[] shape (rather than nesting skills inside courses)
// specifically so a future Job Portal integration can consume
// courses/certificates and skills independently without reshaping this.
exports.getSkillPassport = async (req, res) => {
  try {
    const studentId = req.student._id;
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    const certificates = await Certificate.find({ student: studentId });
    const certByCourse = new Map(certificates.map((c) => [c.course.toString(), c]));

    const skillSet = new Set();
    const courses = [];

    for (const e of enrollments) {
      if (!e.course) continue;

      const { percentage } = await computeProgressStat(studentId, e.course._id);
      const completed = percentage === 100;
      const certificate = certByCourse.get(e.course._id.toString()) || null;
      const skills = completed ? skillsForCourse(e.course) : [];
      skills.forEach((s) => skillSet.add(s));

      courses.push({
        courseId: e.course._id,
        courseName: e.course.name,
        category: e.course.category,
        progressPercent: percentage,
        completed,
        finalGrade: certificate?.finalGrade || null,
        certificateId: certificate?.certificateId || null,
        skills,
      });
    }

    return res.status(200).json({
      studentName: req.student.fullName,
      courses,
      skills: [...skillSet],
      completedCount: courses.filter((c) => c.completed).length,
      certificateCount: certificates.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load skill passport', error: err.message });
  }
};
