const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { generatePassword } = require('../utils/passwordGenerator');

// Replaces crudFactory's generic create for Trainer only (wired in
// trainerRoutes.js) — a Trainer profile on its own was never enough to log
// in (that used to require the trainer self-registering separately, now
// removed), so this mints a real User login in the same request instead of
// leaving the admin to separately click "Reset Password" just to bootstrap
// a first password. The two documents aren't in a transaction (same
// reasoning as the self-registration flow this replaces — this deployment's
// Atlas tier doesn't reliably support them on a standalone/replica setup
// without extra config); if the User half fails after the Trainer half
// succeeds, trainerPasswordController.resetTrainerPassword already handles
// "no login yet" by creating one, so the admin has a safe retry path via
// the existing Reset Password button.
exports.createTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.create(req.body);

    const password = generatePassword();
    const user = await User.create({
      name: trainer.name,
      email: trainer.email,
      password,
      role: 'trainer',
      campus_id: trainer.campus,
      status: 'active',
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'Trainer',
      resourceId: trainer._id,
      summary: `Created trainer "${trainer.name}" with a new portal login`,
      resourceCampus: trainer.campus,
    });

    return res.status(201).json({ item: trainer, credentials: { email: user.email, password } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}: "${err.value}"` });
    return res.status(500).json({ message: 'Failed to create trainer', error: err.message });
  }
};
