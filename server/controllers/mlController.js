const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const { computeFeatures } = require('../ml/features');
const { scoreFeatures, riskBand, loadModel } = require('../ml/predictDropoutRisk');

// Scores every currently active (enrolled/pending) student for dropout risk.
// Completed/dropout students are excluded — the prediction is only
// actionable for students still on the way through the program.
exports.getDropoutRisk = async (req, res) => {
  try {
    const students = await Student.find({ status: { $in: ['enrolled', 'pending'] } });

    const attendanceByStudent = await StudentAttendance.aggregate([
      { $match: { student: { $in: students.map((s) => s._id) } } },
      { $group: { _id: '$student', records: { $push: { status: '$status' } } } },
    ]);
    const attendanceMap = new Map(attendanceByStudent.map((a) => [String(a._id), a.records]));

    const results = students.map((student) => {
      const attendanceRecords = attendanceMap.get(String(student._id)) || [];
      const features = computeFeatures({ student, attendanceRecords });
      const probability = scoreFeatures(features);
      return {
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        course: student.course,
        campus: student.campus,
        status: student.status,
        payment: student.payment,
        attendanceRate: Math.round(features[0] * 100),
        riskScore: Math.round(probability * 100),
        riskBand: riskBand(probability),
      };
    });

    results.sort((a, b) => b.riskScore - a.riskScore);

    const model = loadModel();
    return res.status(200).json({
      students: results,
      modelInfo: {
        trainedAt: model.trainedAt,
        trainingSamples: model.trainingSamples,
        trainAccuracy: model.trainAccuracy,
        featureNames: model.featureNames,
        weights: model.weights,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to compute dropout risk', error: err.message });
  }
};
