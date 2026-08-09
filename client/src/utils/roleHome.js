// Single source of truth for "where does this role land after login" —
// used by both ProtectedRoute (role mismatch) and LoginPage (already
// authenticated) so neither ever falls back to a hardcoded route that
// might not belong to the current user's role.
const ROLE_HOME_ROUTES = {
  super_admin: '/admin/dashboard',
  sub_admin: '/sub-admin/dashboard',
};

export function getRoleHome(role) {
  return ROLE_HOME_ROUTES[role] || null;
}
