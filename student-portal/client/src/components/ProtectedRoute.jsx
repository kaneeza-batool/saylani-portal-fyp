import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { student, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50" />;
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  // Every student must have completed the mandatory profile-picture step
  // before touching anything else — gate on hasCompletedOnboarding (not
  // avatarUrl directly, see Student model comment) so a direct URL visit to
  // e.g. /courses can't skip it, and completing it once never re-triggers.
  // This runs before the portalAccess check below on purpose: a pending
  // applicant still gets to finish onboarding (server-side, protectAny
  // allows exactly this — see authMiddleware.js), just not anything past
  // it.
  if (!student.hasCompletedOnboarding && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (student.hasCompletedOnboarding && pathname === '/onboarding') {
    return <Navigate to={student.portalAccess ? '/courses' : '/pending-approval'} replace />;
  }

  // Admission not yet approved (or rejected/dropped) — onboarding is done,
  // but nothing else is reachable until that changes. Every other portal
  // route ends up here instead of whatever it actually asked for.
  if (!student.portalAccess && pathname !== '/pending-approval' && pathname !== '/onboarding') {
    return <Navigate to="/pending-approval" replace />;
  }
  // Got approved since the last time this page loaded (e.g. Super Admin
  // approved them while this tab was already open on /pending-approval) —
  // send them into the real app instead of leaving them stuck here.
  if (student.portalAccess && pathname === '/pending-approval') {
    return <Navigate to="/courses" replace />;
  }

  return <Outlet />;
}
