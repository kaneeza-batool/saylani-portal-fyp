import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleHome';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 text-body-sm text-neutral-400 font-sans">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong portal for this role, not "not logged in" — sending them back to
    // /login would bounce straight back here (LoginPage redirects an
    // authenticated user away from /login), looping forever. Send them to
    // their own portal instead, or a dead-end page if they don't have one.
    return <Navigate to={getRoleHome(user.role) || '/unauthorized'} replace />;
  }

  return <Outlet />;
}
