const mongoose = require('mongoose');

// Write mirror of student-portal/server/models/Assignment.js — same
// reasoning as StudentPortalQuiz.js: a trainer-created assignment has to
// land in the exact collection Student Portal's own Assignment model
// reads from, field-for-field, or it's invisible on that side. `course`
// is a plain name string (Student Portal's own convention — see
// assignmentController.getAssignments: `Assignment.find({ course:
// req.student.course })`), not an ObjectId ref.
const studentPortalAssignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    referenceLinks: [{ type: String, trim: true }],
    dueDate: { type: Date, required: true },
    isHackathon: { type: Boolean, default: false },
    course: { type: String, required: true, trim: true, index: true },
    // Not on student-portal's schema — additive, harmless (an undeclared
    // path is invisible to a schema that doesn't know about it). Lets the
    // Trainer Portal show "my assignments" without a separate collection.
    createdByTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPortalAssignment', studentPortalAssignmentSchema, 'assignments');
