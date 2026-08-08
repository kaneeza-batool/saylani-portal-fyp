const Trainer = require('../models/Trainer');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Trainer, {
  searchFields: ['name', 'email', 'employeeId', 'course', 'city'],
  resourceType: 'Trainer',
  label: (doc) => doc.name,
});

module.exports = buildCrudRouter(controller);
