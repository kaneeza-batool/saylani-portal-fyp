const AuditLog = require('../models/AuditLog');

// Read-only — audit entries are written automatically (see utils/auditLogger.js),
// never created/edited by hand. Powers both the Audit Log page (all actions)
// and the Updation page (?action=update).
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { action, resourceType, search, startDate, endDate } = req.query;

    // req.campusFilter is only set when campusScope ran (sub_admin route) —
    // `{}` for super_admin, so this is purely additive and doesn't change
    // super_admin's existing result set (see campusScope.js).
    const filter = { ...(req.campusFilter || {}) };
    if (action && action !== 'all') filter.action = action;
    if (resourceType && resourceType !== 'all') filter.resourceType = resourceType;
    if (search && search.trim()) {
      filter.$or = [{ summary: new RegExp(search.trim(), 'i') }, { actorName: new RegExp(search.trim(), 'i') }];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load audit log', error: err.message });
  }
};
