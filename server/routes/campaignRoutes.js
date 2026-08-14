const Campaign = require('../models/Campaign');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Campaign, {
  searchFields: ['title', 'category'],
  resourceType: 'Campaign',
  label: (doc) => doc.title,
});

module.exports = buildCrudRouter(controller);
