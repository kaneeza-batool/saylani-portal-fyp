const Course = require('../models/Course');

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ courses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch course', error: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }
    data.slug = slugify(data.title);

    const existing = await Course.findOne({ slug: data.slug });
    if (existing) {
      return res.status(400).json({ message: 'A course with this title already exists.' });
    }

    const course = await Course.create(data);
    return res.status(201).json({ course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create course', error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.title) {
      data.slug = slugify(data.title);
    }
    const course = await Course.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ message: 'Course deactivated.', course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete course', error: err.message });
  }
};

exports.uploadCourseImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }
    const imageUrl = req.file.path;
    const course = await Course.findByIdAndUpdate(req.params.id, { imageUrl, img: imageUrl }, { new: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ course });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upload image', error: err.message });
  }
};
