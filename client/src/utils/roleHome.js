// Single source of truth for "where does this role land after login" —
// used by both ProtectedRoute (role mismatch) and LoginPage (already
// authenticated) so neither ever falls back to a hardcoded route that
// might not belong to the current user's role.
const ROLE_HOME_ROUTES = {
  super_admin: '/admin/dashboard',
  sub_admin: '/sub-admin/dashboard',
  trainer: '/trainer/dashboard',
  employer: '/employer/dashboard',
};

export function getRoleHome(role) {
  return ROLE_HOME_ROUTES[role] || null;
}

// Used by LoginPage to decide whether a carried-over `location.state.from`
// (set by ProtectedRoute's redirect-to-/login on a 401) is safe to honor for
// the user who just logged in. Deliberately keyed on the role's own portal
// prefix, not "is this route technically reachable" — /admin/profile IS
// reachable by both roles (see App.jsx), but it's not sub_admin's home turf,
// and honoring it for them defeats the point of this check: logging out
// from /admin/profile as a super_admin and back in as a sub_admin must not
// land the sub_admin back on a page they didn't navigate to themselves.
export function isRouteAllowedForRole(pathname, role) {
  if (!pathname) return false;
  const prefix = role === 'sub_admin' ? '/sub-admin' : role === 'trainer' ? '/trainer' : role === 'employer' ? '/employer' : '/admin';
  return pathname.startsWith(prefix);
}
