const crypto = require('crypto');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

// Avoids visually ambiguous characters (0/O, 1/l/I) since this gets read
// aloud or typed by hand when an admin shares it with a trainer.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';

function generatePassword(length = 12) {
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  }
  return pw;
}

// A trainer's real password is bcrypt-hashed and never recoverable — there
// is no "show me their password" this could implement even in principle.
// This is the actual equivalent for "trainer forgot their password": mint
// a brand-new one, show it to the admin exactly once in this response (it
// is never stored or logged anywhere in plaintext), and the trainer uses
// it to log in and can change it from their own Profile page afterward.
exports.resetTrainerPassword = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ _id: req.params.id, ...req.campusFilter });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    // Only a self-registered trainer (see authController.registerTrainer)
    // has a real User login linked by email — a Trainer profile created
    // manually via "+ Add Trainer" has no account to reset.
    const user = await User.findOne({ email: trainer.email, role: 'trainer' });
    if (!user) {
      return res.status(404).json({ message: 'This trainer has not created a portal login yet.' });
    }

    const newPassword = generatePassword();
    user.password = newPassword;
    await user.save();

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Trainer',
      resourceId: trainer._id,
      summary: `Reset login password for "${trainer.name}"`,
      resourceCampus: trainer.campus,
    });

    return res.status(200).json({ email: user.email, password: newPassword });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};
