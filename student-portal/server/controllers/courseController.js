require('../models/Slot'); // registers 'Slot' so .populate('batch') resolves it

// One course per student (see Student.js) — course is a plain name string on
// the shared Student document, not an Enrollment row. Returns it as a
// single-item array in the exact shape CoursesPage.jsx/ProfilePage.jsx
// already expect (both read this same endpoint), so neither component needs
// rewriting — only the data source changes, matching the same pattern
// already applied to Attendance/Dashboard/Payment.
exports.getEnrolledCourses = async (req, res) => {
  try {
    const student = req.student;
    if (!student.course) return res.status(200).json({ courses: [] });

    await student.populate({ path: 'batch', select: 'schedule' });

    const course = {
      _id: student._id,
      name: student.course,
      category: null,
      durationWeeks: null,
      batch: student.batch?.schedule || null,
      rollNumber: student.rollNumber || null,
      campus: student.campus?.name || null,
      city: student.campus?.city || null,
      status: student.status,
      progressPercent: 0,
      enrolledAt: null,
    };

    return res.status(200).json({ courses: [course] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load enrolled courses', error: err.message });
  }
};
