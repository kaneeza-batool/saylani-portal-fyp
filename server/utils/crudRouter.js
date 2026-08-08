const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

function buildCrudRouter(controller, { roles = ['super_admin'] } = {}) {
  const router = express.Router();
  router.use(protect, restrictTo(...roles));
  router.get('/', controller.getAll);
  router.get('/:id', controller.getOne);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { buildCrudRouter };
