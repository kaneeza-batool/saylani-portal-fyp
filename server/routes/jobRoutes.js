const Job = require('../models/Job');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Job, {
  searchFields: ['title', 'company', 'location'],
  resourceType: 'Job',
  label: (doc) => `${doc.title} @ ${doc.company}`,
});

module.exports = buildCrudRouter(controller);
