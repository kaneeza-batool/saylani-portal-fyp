const Trainer = require('../models/Trainer');
const { logAudit } = require('../utils/auditLogger');

// Narrow, status-only endpoint — a sub_admin can flip a trainer active/
// inactive for their own campus without the full edit access the generic
// crudFactory PATCH /:id grants (that route stays super_admin-only, see
// trainerRoutes.js). Scoped via req.campusFilter same as the list route.
exports.updateTrainerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'status must be active or inactive' });
    }

    const trainer = await Trainer.findOne({ _id: req.params.id, ...req.campusFilter });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    if (trainer.status === status) {
      return res.status(200).json({ trainer });
    }

    const oldStatus = trainer.status;
    trainer.status = status;
    await trainer.save();

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Trainer',
      resourceId: trainer._id,
      summary: `Changed "${trainer.name}"'s status from ${oldStatus} to ${status}`,
      resourceCampus: trainer.campus,
    });

    return res.status(200).json({ trainer });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update trainer status', error: err.message });
  }
};
