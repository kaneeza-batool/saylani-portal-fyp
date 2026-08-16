const express = require('express');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Read-only, deliberately not the shared buildCrudController/buildCrudRouter
// factory (crudFactory.js/crudRouter.js) — those always wire POST/PATCH/
// DELETE with no opt-out, and this collection must never accept a write from
// this app again (see models/Course.js). Course content is authored in the
// public website's own admin panel; this only ever reads what's there.
const router = express.Router();
router.use(protect, restrictTo('super_admin'));

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status } = req.query;

    const filter = {};
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: re }, { desc: re }, { category: re }];
    }

    const [items, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Course.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load courses', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Course.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load course', error: err.message });
  }
});

module.exports = router;
