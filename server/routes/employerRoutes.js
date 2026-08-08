const Employer = require('../models/Employer');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Employer, {
  searchFields: ['companyName', 'contactEmail', 'city'],
  resourceType: 'Employer',
  label: (doc) => doc.companyName,
});

module.exports = buildCrudRouter(controller);
