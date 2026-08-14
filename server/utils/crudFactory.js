// Shared list/get/create/update/delete handlers for the "core data" admin
// resources (Campus, Trainer, Course, Employer). Search/filter/pagination
// behavior mirrors studentController.js exactly — this factory exists so
// that shape doesn't get re-typed (and drift) four more times. Resources
// with real custom logic (auth, dashboard, students' payment default,
// sub-admins' password handling) intentionally stay as their own
// hand-written controllers rather than being forced through this.

const { logAudit, resolveCampusIdByName } = require('./auditLogger');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The resource whose own campus should surface on its audit entry when the
// actor has none (see auditLogger.js's resolution order). A Campus record's
// "campus" is itself (its own _id) — Trainer/Slot carry a real ObjectId ref,
// Quiz only a free-text campus name String that needs resolving, and
// Course/Employer/Job carry no campus at all (genuinely global resources),
// so this correctly returns null for them.
async function resolveResourceCampus(resourceType, item) {
  if (resourceType === 'Campus') return item._id;
  const c = item.campus;
  if (!c) return null;
  return typeof c === 'string' ? resolveCampusIdByName(c) : c;
}

function buildCrudController(
  Model,
  {
    searchFields = [],
    statusField = 'status',
    resourceType = Model.modelName,
    label = (doc) => doc.name || doc._id,
    // Opt-in only — Mongoose 6+ throws if you .populate() a path a schema
    // doesn't have, so this must stay empty for resources with no such
    // field (Course, Employer, Campus) rather than being applied blindly.
    populate = [],
    // Opt-in only — for list-response fields that aren't on the model at
    // all and need a second query (e.g. Slot's studentCount, a count of
    // Students referencing each Slot). Receives the fetched Mongoose docs,
    // returns plain objects/docs to serialize; a no-op by default so
    // resources that don't need it pay nothing extra.
    annotate = async (items) => items,
  }
) {
  return {
    async getAll(req, res) {
      try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const { search, status } = req.query;

        // req.campusFilter is only set when campusScope middleware ran for
        // this route (see routes wiring) — spreading `{}` when it didn't is
        // a no-op, so routes that never run campusScope are unaffected.
        const filter = { ...(req.campusFilter || {}) };
        if (status && status !== 'all') filter[statusField] = status;
        if (search && search.trim() && searchFields.length) {
          const re = new RegExp(escapeRegex(search.trim()), 'i');
          filter.$or = searchFields.map((field) => ({ [field]: re }));
        }

        let query = Model.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
        for (const p of populate) query = query.populate(p);

        const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
        const annotated = await annotate(items);

        return res.status(200).json({
          items: annotated,
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
        let query = Model.findById(req.params.id);
        for (const p of populate) query = query.populate(p);
        const item = await query;
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
          resourceCampus: await resolveResourceCampus(resourceType, item),
        });
        return res.status(201).json({ item });
      } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}: "${err.value}"` });
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
          resourceCampus: await resolveResourceCampus(resourceType, item),
        });
        return res.status(200).json({ item });
      } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}: "${err.value}"` });
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
          resourceCampus: await resolveResourceCampus(resourceType, item),
        });
        return res.status(200).json({ message: 'Deleted' });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to delete record', error: err.message });
      }
    },
  };
}

module.exports = { buildCrudController };
