const Campus = require('../models/Campus');

// Public, read-only, name/city only — used by the trainer self-registration
// form (and anywhere else public-facing that needs a campus picker) to
// build a dropdown without needing an authenticated admin session.
exports.listPublicCampuses = async (_req, res) => {
  try {
    const campuses = await Campus.find({ status: 'active' }, 'name city').sort({ name: 1 });
    return res.status(200).json({ items: campuses });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campuses', error: err.message });
  }
};
