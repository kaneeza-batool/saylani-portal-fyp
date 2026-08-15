const Campus = require('../models/Campus');
const Student = require('../models/Student');

// Both unauthenticated on purpose — the enrollment form (public, no login)
// needs to populate its campus and course pickers before an applicant has
// any account at all. campusRoutes.js on the main app is auth-gated and
// can't be called from here.
exports.getCampuses = async (req, res) => {
  try {
    const campuses = await Campus.find({}).sort({ name: 1 });
    return res.status(200).json({ campuses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campuses', error: err.message });
  }
};

// Sourced from Student.COURSES (the shared enum) rather than duplicated as
// a literal array here, so the form's picker can't silently drift from
// what a Student document will actually accept.
exports.getCourseOptions = async (req, res) => {
  return res.status(200).json({ courses: Student.COURSES });
};
