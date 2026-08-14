// Factory: checkPermission('STUDENT', 'read') => middleware. super_admin
// bypasses all checks; everyone else needs permissions[module][action] === true.
function checkPermission(module, action) {
  return (req, res, next) => {
    if (req.user.role === 'super_admin') return next();

    if (req.user.permissions?.[module]?.[action] !== true) {
      return res.status(403).json({
        message: `You do not have permission to ${action} ${module.toLowerCase()}`,
      });
    }
    next();
  };
}

module.exports = { checkPermission };
