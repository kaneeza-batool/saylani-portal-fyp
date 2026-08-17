const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true }, // cached for display
    rollNumber: { type: String, required: true },
    course: { type: String, default: '' },
    campus: { type: String, default: '' },
    date: { type: Date, required: true, default: () => new Date(new Date().toDateString()) },
    status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
  },
  { timestamps: true }
);

// One attendance record per student per day.
studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
