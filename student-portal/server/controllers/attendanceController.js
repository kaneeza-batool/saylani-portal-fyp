const Attendance = require('../models/Attendance');

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const records = await Attendance.find({ student: req.student._id, courseId });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

    return res.status(200).json({ total, present, leave, absent, percentage });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance summary', error: err.message });
  }
};

exports.getAttendanceByMonth = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { month } = req.query; // 'YYYY-MM'
    const all = await Attendance.find({ student: req.student._id, courseId }).sort({ date: -1 });

    const availableMonths = [...new Set(all.map((r) => r.date.toISOString().slice(0, 7)))];

    const targetMonth = month || availableMonths[0] || null;
    const records = targetMonth ? all.filter((r) => r.date.toISOString().slice(0, 7) === targetMonth) : [];

    return res.status(200).json({ month: targetMonth, availableMonths, records });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load monthly attendance', error: err.message });
  }
};

exports.getStreak = async (req, res) => {
  try {
    const { courseId } = req.params;
    const records = await Attendance.find({ student: req.student._id, courseId }).sort({ date: -1 });

    let streak = 0;
    for (const record of records) {
      if (record.status === 'present') streak += 1;
      else break;
    }

    return res.status(200).json({ streak });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to calculate streak', error: err.message });
  }
};
