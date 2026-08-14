// Runs after `protect` (req.user must already be populated). Never trust a
// campus id from req.query/req.body — it always comes from the logged-in
// user, so a scoped user can't widen their own filter by passing a param.
function campusScope(req, res, next) {
  if (req.user.role === 'super_admin') {
    req.campusFilter = {};
  } else {
    req.campusFilter = { campus: req.user.campus_id };
  }
  next();
}

module.exports = { campusScope };
