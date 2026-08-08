const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

// Sub-admins are Users with role 'sub_admin' — no separate model. Custom
// (not the crudFactory) because create needs a password + forced role,
// and responses must never include the hashed password.

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSafeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    campus_id: user.campus_id,
    status: user.status,
    avatar_url: user.avatar_url,
    createdAt: user.createdAt,
  };
}

exports.getSubAdmins = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status } = req.query;

    const filter = { role: 'sub_admin' };
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('campus_id', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      items: users.map(toSafeUser),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load sub-admins', error: err.message });
  }
};

exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, campus_id, status } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const user = await User.create({ name, email, password, campus_id, status, role: 'sub_admin' });
    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'SubAdmin',
      resourceId: user._id,
      summary: `Created sub-admin "${user.name}"`,
    });
    return res.status(201).json({ item: toSafeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A user with this email already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create sub-admin', error: err.message });
  }
};

exports.updateSubAdmin = async (req, res) => {
  try {
    const { name, email, campus_id, status } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'sub_admin' },
      { name, email, campus_id, status },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!user) return res.status(404).json({ message: 'Sub-admin not found' });
    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'SubAdmin',
      resourceId: user._id,
      summary: `Updated sub-admin "${user.name}"`,
    });
    return res.status(200).json({ item: toSafeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A user with this email already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update sub-admin', error: err.message });
  }
};

exports.deleteSubAdmin = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'sub_admin' });
    if (!user) return res.status(404).json({ message: 'Sub-admin not found' });
    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'SubAdmin',
      resourceId: user._id,
      summary: `Deleted sub-admin "${user.name}"`,
    });
    return res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete sub-admin', error: err.message });
  }
};
