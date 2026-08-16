const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

function buildCrudRouter(
  controller,
  {
    roles = ['super_admin'],
    readRoles = roles,
    listRoles = readRoles,
    listMiddleware = [],
    // Separate from `roles` (which still governs update/delete) so a
    // resource can open up creation to a wider role than editing/deleting —
    // e.g. sub_admin adding trainers within their own campus, without also
    // getting the generic PATCH/DELETE super_admin keeps.
    createRoles = roles,
    createMiddleware = [],
  } = {}
) {
  const router = express.Router();
  router.use(protect);
  router.get('/', restrictTo(...listRoles), ...listMiddleware, controller.getAll);
  router.get('/:id', restrictTo(...readRoles), controller.getOne);
  router.post('/', restrictTo(...createRoles), ...createMiddleware, controller.create);
  router.patch('/:id', restrictTo(...roles), controller.update);
  router.delete('/:id', restrictTo(...roles), controller.remove);
  return router;
}

module.exports = { buildCrudRouter };
