const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

function buildCrudRouter(controller, { roles = ['super_admin'], readRoles = roles } = {}) {
  const router = express.Router();
  router.use(protect);
  router.get('/', restrictTo(...readRoles), controller.getAll);
  router.get('/:id', restrictTo(...readRoles), controller.getOne);
  router.post('/', restrictTo(...roles), controller.create);
  router.patch('/:id', restrictTo(...roles), controller.update);
  router.delete('/:id', restrictTo(...roles), controller.remove);
  return router;
}

module.exports = { buildCrudRouter };
