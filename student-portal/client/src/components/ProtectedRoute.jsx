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
  if (!student.hasCompletedOnboarding && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (student.hasCompletedOnboarding && pathname === '/onboarding') {
    return <Navigate to="/courses" replace />;
  }

  return <Outlet />;
}
