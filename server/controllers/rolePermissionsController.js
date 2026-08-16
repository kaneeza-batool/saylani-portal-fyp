const User = require('../models/User');
const { FULL_ACCESS_PERMISSIONS } = require('../utils/fullAccessPermissions');

// The exact module/action shape User.permissions is built from (see
// models/User.js) — kept here too so this controller can validate an
// incoming permissions payload against it without trusting arbitrary keys
// the client sends straight into a Mongoose $set.
const PERMISSION_SHAPE = {
  STUDENT: ['read', 'write', 'update'],
  ATTENDANCE_VIEW: ['read', 'write'],
  ATTENDANCE_MARK: ['read', 'write', 'update'],
  ATTENDANCE_ADD_MULTI: ['read', 'write', 'update'],
  TRAINER: ['read', 'write'],
  TRAINER_ATTENDANCE_MARK: ['read', 'write', 'update'],
  TRAINER_ATTENDANCE_VIEW: ['read', 'write'],
  BATCH: ['read', 'write', 'update'],
  ADMISSIONS: ['read', 'write', 'update'],
  FEEDBACK: ['read'],
  ALERTS: ['read'],
  AUDIT: ['read'],
};

// Sub-admins are the only role with a real, per-user, server-enforced
// permission grant (see middleware/checkPermission.js) — Trainer and
// Student access is fixed by role at the route level (restrictTo), not
// user-editable, so there's nothing to list/update for those two roles
// here. The frontend's Roles & Permissions page shows that distinction
// explicitly rather than faking editable toggles that would do nothing.
exports.getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'sub_admin' })
      .select('name email campus_id status permissions')
      .populate('campus_id', 'name')
      .sort({ name: 1 });

    return res.status(200).json({ items: subAdmins, shape: PERMISSION_SHAPE });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load sub-admins', error: err.message });
  }
};

exports.updateSubAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'permissions object is required' });
    }

    // Build a clean permissions object from only the known modules/actions —
    // never spread the client payload directly into the update, so an
    // unexpected key can't ride along into the document.
    const clean = {};
    for (const [module, actions] of Object.entries(PERMISSION_SHAPE)) {
      clean[module] = {};
      for (const action of actions) {
        clean[module][action] = Boolean(permissions[module]?.[action]);
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'sub_admin' },
      { permissions: clean },
      { new: true, runValidators: true, context: 'query' }
    ).select('name email campus_id status permissions');
    if (!user) return res.status(404).json({ message: 'Sub-admin not found' });

    return res.status(200).json({ item: user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update permissions', error: err.message });
  }
};

// One-click "grant everything" — same constant createSubAdmin already uses
// for brand-new accounts, exposed here so an existing sub-admin's grants
// can be reset to it too instead of ticking 25 boxes by hand.
exports.grantFullAccess = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'sub_admin' },
      { permissions: FULL_ACCESS_PERMISSIONS },
      { new: true, runValidators: true, context: 'query' }
    ).select('name email campus_id status permissions');
    if (!user) return res.status(404).json({ message: 'Sub-admin not found' });

    return res.status(200).json({ item: user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update permissions', error: err.message });
  }
};
