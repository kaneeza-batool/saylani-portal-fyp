const Slot = require('../models/Slot');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Slot, {
  searchFields: ['schedule', 'trainer', 'course', 'campus'],
  resourceType: 'Slot',
  label: (doc) => `${doc.course} — ${doc.schedule}`,
});

module.exports = buildCrudRouter(controller);
