const Certificate = require('../models/Certificate');

// Hardcoded per-course skill mapping — there's no curriculum/tagging system
// to derive this from yet, so this is a reasonable stand-in until courses
// carry their own structured skill/topic tags. Falls back to the course's
// category string as a single skill if a course isn't explicitly listed,
// so a future course never contributes zero skills silently.
const SKILL_MAP = {
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'REST APIs', 'Git & GitHub'],
  'AI & Data Science': ['Python', 'Machine Learning', 'Data Analysis', 'Deep Learning', 'SQL', 'Statistics'],
};

function skillsForCourse(courseName) {
  return SKILL_MAP[courseName] || [];
}

// One course per student (see Student.js) — course is a plain name string on
// the shared Student document, not an Enrollment row. "Completed" reads
// Student.status directly (the same field the admin side transitions via
// the Admissions/roster flow), not a computed progress percentage that has
// no real data source. Certificates are queried by student only — the
// Certificate model still requires a course ObjectId, which nothing in this
// merge can ever produce, so the collection stays genuinely empty; that's
// left as an honest empty state rather than faking a certificate into
// existence.
exports.getSkillPassport = async (req, res) => {
  try {
    const student = req.student;
    const certificates = await Certificate.find({ student: student._id });

    const courses = [];
    const skillSet = new Set();

    if (student.course) {
      const completed = student.status === 'completed';
      const skills = completed ? skillsForCourse(student.course) : [];
      skills.forEach((s) => skillSet.add(s));

      courses.push({
        courseId: student._id,
        courseName: student.course,
        category: null,
        progressPercent: completed ? 100 : 0,
        completed,
        finalGrade: null,
        certificateId: null,
        skills,
      });
    }

    return res.status(200).json({
      studentName: student.name,
      courses,
      skills: [...skillSet],
      completedCount: courses.filter((c) => c.completed).length,
      certificateCount: certificates.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load skill passport', error: err.message });
  }
};
