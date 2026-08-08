const Campus = require('../models/Campus');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Campus, {
  searchFields: ['name', 'city', 'phone'],
  resourceType: 'Campus',
  label: (doc) => doc.name,
});

module.exports = buildCrudRouter(controller);
