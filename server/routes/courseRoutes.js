const Course = require('../models/Course');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Course, {
  searchFields: ['name', 'description'],
  resourceType: 'Course',
  label: (doc) => doc.name,
});

module.exports = buildCrudRouter(controller);
