const Course = require('../models/Course');

exports.listPublicCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ courses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
};

exports.getCourseBySlug = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch course', error: err.message });
  }
};
