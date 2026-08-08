// Shared list/get/create/update/delete handlers for the "core data" admin
// resources (Campus, Trainer, Course, Employer). Search/filter/pagination
// behavior mirrors studentController.js exactly — this factory exists so
// that shape doesn't get re-typed (and drift) four more times. Resources
// with real custom logic (auth, dashboard, students' payment default,
// sub-admins' password handling) intentionally stay as their own
// hand-written controllers rather than being forced through this.

const { logAudit } = require('./auditLogger');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCrudController(
  Model,
  { searchFields = [], statusField = 'status', resourceType = Model.modelName, label = (doc) => doc.name || doc._id }
) {
  return {
    async getAll(req, res) {
      try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const { search, status } = req.query;

        const filter = {};
        if (status && status !== 'all') filter[statusField] = status;
        if (search && search.trim() && searchFields.length) {
          const re = new RegExp(escapeRegex(search.trim()), 'i');
          filter.$or = searchFields.map((field) => ({ [field]: re }));
        }

        const [items, total] = await Promise.all([
          Model.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
          Model.countDocuments(filter),
        ]);

        return res.status(200).json({
          items,
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to load records', error: err.message });
      }
    },

    async getOne(req, res) {
      try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        return res.status(200).json({ item });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to load record', error: err.message });
      }
    },

    async create(req, res) {
      try {
        const item = await Model.create(req.body);
        logAudit({
          actor: req.user,
          action: 'create',
          resourceType,
          resourceId: item._id,
          summary: `Created ${resourceType.toLowerCase()} "${label(item)}"`,
        });
        return res.status(201).json({ item });
      } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: 'Failed to create record', error: err.message });
      }
    },

    async update(req, res) {
      try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
          context: 'query',
        });
        if (!item) return res.status(404).json({ message: 'Not found' });
        logAudit({
          actor: req.user,
          action: 'update',
          resourceType,
          resourceId: item._id,
          summary: `Updated ${resourceType.toLowerCase()} "${label(item)}"`,
        });
        return res.status(200).json({ item });
      } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        return res.status(500).json({ message: 'Failed to update record', error: err.message });
      }
    },

    async remove(req, res) {
      try {
        const item = await Model.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        logAudit({
          actor: req.user,
          action: 'delete',
          resourceType,
          resourceId: item._id,
          summary: `Deleted ${resourceType.toLowerCase()} "${label(item)}"`,
        });
        return res.status(200).json({ message: 'Deleted' });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to delete record', error: err.message });
      }
    },
  };
}

module.exports = { buildCrudController };
