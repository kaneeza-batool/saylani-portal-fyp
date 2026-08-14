const Feedback = require('../models/Feedback');

// Feedback.campus is a real ObjectId ref (unlike StudentAttendance.campus —
// see that controller's comments), so req.campusFilter from campusScope is
// safe to use directly here, same pattern as admissionController.js.
exports.getFeedback = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { trainer, rating } = req.query;

    // trainerAverages is scoped to the campus only — deliberately ignores
    // the trainer/rating filters below, so the summary panel stays a stable
    // whole-campus overview while the table beneath it narrows.
    const campusFilter = { ...req.campusFilter };

    const filter = { ...campusFilter };
    if (trainer) filter.trainer = trainer;
    if (rating && rating !== 'all') filter.rating = Number(rating);

    const [items, total, trainerAverages] = await Promise.all([
      Feedback.find(filter)
        .populate('student', 'name')
        .populate('batch', 'schedule course')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Feedback.countDocuments(filter),
      Feedback.aggregate([
        { $match: campusFilter },
        { $group: { _id: '$trainer', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      trainerAverages: trainerAverages.map((t) => ({
        trainer: t._id,
        avgRating: Math.round(t.avgRating * 10) / 10,
        count: t.count,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load feedback', error: err.message });
  }
};
