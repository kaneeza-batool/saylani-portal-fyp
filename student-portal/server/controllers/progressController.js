const CourseModule = require('../models/CourseModule');

exports.getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const modules = await CourseModule.find({ student: req.student._id, courseId }).sort({ order: 1 });

    const results = modules.map((m) => {
      const totalTopics = m.topics.length;
      const completedTopics = m.topics.filter((t) => t.isCompleted).length;
      const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        _id: m._id,
        moduleName: m.moduleName,
        order: m.order,
        totalTopics,
        completedTopics,
        percentage,
        topics: m.topics.map((t) => ({
          _id: t._id,
          topicName: t.topicName,
          isCompleted: t.isCompleted,
        })),
      };
    });

    // Weighted by topic count (not a plain average of per-module
    // percentages), so a module with 11 topics counts more than one with 5.
    const totalTopics = results.reduce((sum, m) => sum + m.totalTopics, 0);
    const completedTopics = results.reduce((sum, m) => sum + m.completedTopics, 0);
    const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return res.status(200).json({
      modules: results,
      overallPercentage,
      totalTopics,
      completedTopics,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load progress', error: err.message });
  }
};
