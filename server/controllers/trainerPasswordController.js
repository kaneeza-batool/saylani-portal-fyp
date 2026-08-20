const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { generatePassword } = require('../utils/passwordGenerator');

const normalizePhone = (p) => String(p || '').replace(/\D/g, '');

// A trainer's real password is bcrypt-hashed and never recoverable — there
// is no "show me their password" this could implement even in principle.
// This is the actual equivalent for "trainer forgot their password": mint
// a brand-new one, show it to the admin exactly once in this response (it
// is never stored or logged anywhere in plaintext), and the trainer uses
// it to log in and can change it from their own Profile page afterward.
//
// Also doubles as a "bootstrap a login" action: every trainer created via
// createTrainerController.createTrainer already gets one, but this stays
// resilient for any trainer that somehow doesn't (a pre-existing profile
// from before that flow existed, or a partial failure it left behind).
exports.resetTrainerPassword = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ _id: req.params.id, ...req.campusFilter });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    const newPassword = generatePassword();
    let user = await User.findOne({ email: trainer.email, role: 'trainer' });
    const hadLogin = Boolean(user);
    if (user) {
      user.password = newPassword;
      await user.save();
    } else {
      user = await User.create({
        name: trainer.name,
        email: trainer.email,
        password: newPassword,
        role: 'trainer',
        campus_id: trainer.campus,
        status: 'active',
      });
    }

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Trainer',
      resourceId: trainer._id,
      summary: hadLogin ? `Reset login password for "${trainer.name}"` : `Created a portal login for "${trainer.name}"`,
      resourceCampus: trainer.campus,
    });

    return res.status(200).json({ email: user.email, password: newPassword });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

// ---- Trainer self-service "forgot password" — verified by CNIC, same
// two-step pattern as student-portal's verify-cnic/set-password, with phone
// as the secondary factor (a trainer always already has a password by the
// time they'd use this, unlike a freshly-admitted student, so this is
// always a "reset," never a "first time set"). Both public, rate-limited
// at the route level (see server/routes/authRoutes.js). ----

exports.verifyTrainerCnic = async (req, res) => {
  try {
    const { cnic } = req.body;
    if (!cnic) return res.status(400).json({ message: 'CNIC is required' });

    const trainer = await Trainer.findOne({ cnic: normalizePhone(cnic) });
    if (!trainer) return res.status(404).json({ message: 'No trainer found with this CNIC' });

    return res.status(200).json({ verified: true, name: trainer.name });
  } catch (err) {
    return res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

exports.resetTrainerPasswordByCnic = async (req, res) => {
  try {
    const { cnic, phone, newPassword } = req.body;
    if (!cnic || !phone || !newPassword) {
      return res.status(400).json({ message: 'CNIC, phone, and a new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const trainer = await Trainer.findOne({ cnic: normalizePhone(cnic) });
    if (!trainer) return res.status(404).json({ message: 'No trainer found with this CNIC' });

    if (!trainer.phone) {
      return res.status(400).json({ message: 'No phone number on file for this account — contact your administrator to reset your password.' });
    }
    if (normalizePhone(trainer.phone) !== normalizePhone(phone)) {
      return res.status(401).json({ message: "That phone number doesn't match our records." });
    }

    let user = await User.findOne({ email: trainer.email, role: 'trainer' });
    if (user) {
      user.password = newPassword;
      await user.save();
    } else {
      user = await User.create({
        name: trainer.name,
        email: trainer.email,
        password: newPassword,
        role: 'trainer',
        campus_id: trainer.campus,
        status: 'active',
      });
    }

    logAudit({
      actor: user,
      action: 'update',
      resourceType: 'Trainer',
      resourceId: trainer._id,
      summary: `Trainer "${trainer.name}" reset their own password via CNIC verification`,
      resourceCampus: trainer.campus,
    });

    return res.status(200).json({ message: 'Password updated — you can now log in.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};
