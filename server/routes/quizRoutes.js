const Quiz = require('../models/Quiz');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Quiz, {
  searchFields: ['title', 'course', 'campus'],
  resourceType: 'Quiz',
  label: (doc) => doc.title,
});

module.exports = buildCrudRouter(controller);
