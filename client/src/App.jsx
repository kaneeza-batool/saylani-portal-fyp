import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getRoleHome } from './utils/roleHome';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SubAdminLayout from './layouts/SubAdminLayout';
import DashboardPage from './portals/super-admin/DashboardPage';
import StudentsPage from './portals/super-admin/StudentsPage';
import CampusesPage from './portals/super-admin/CampusesPage';
import SubAdminsPage from './portals/super-admin/SubAdminsPage';
import TrainersPage from './portals/super-admin/TrainersPage';
import TrainersAttendanceMark from './portals/super-admin/trainers/TrainersAttendanceMark';
import TrainersAttendanceView from './portals/super-admin/trainers/TrainersAttendanceView';
import TrainersAttendanceRequest from './portals/super-admin/trainers/TrainersAttendanceRequest';
import CoursesPage from './portals/super-admin/CoursesPage';
import MarkAttendance from './portals/super-admin/attendance/MarkAttendance';
import ViewAttendance from './portals/super-admin/attendance/ViewAttendance';
import MultiAttendance from './portals/super-admin/attendance/MultiAttendance';
import SlotsPage from './portals/super-admin/administration/SlotsPage';
import QuizzesPage from './portals/super-admin/QuizzesPage';
import EmployersPage from './portals/super-admin/EmployersPage';
import JobsPage from './portals/super-admin/JobsPage';
import Reports from './portals/super-admin/Reports';
import AuditLog from './portals/super-admin/AuditLog';
import Updation from './portals/super-admin/Updation';
import Settings from './portals/super-admin/Settings';
import Profile from './portals/super-admin/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Same hardcoded-fallback problem this whole fix addresses, just at the
// catch-all level — route unmatched paths by the current user's role
// instead of always assuming /admin/dashboard.
function CatchAll() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHome(user.role) || '/unauthorized'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="/admin" element={<SuperAdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="campuses" element={<CampusesPage />} />
                <Route path="subadmins" element={<SubAdminsPage />} />
                <Route path="trainers" element={<TrainersPage />} />
                <Route path="trainers/attendance/mark" element={<TrainersAttendanceMark />} />
                <Route path="trainers/attendance/view" element={<TrainersAttendanceView />} />
                <Route path="trainers/attendance/request" element={<TrainersAttendanceRequest />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="attendance/mark" element={<MarkAttendance />} />
                <Route path="attendance/view" element={<ViewAttendance />} />
                <Route path="attendance/multi" element={<MultiAttendance />} />
                <Route path="administration/slots" element={<SlotsPage />} />
                <Route path="quiz" element={<QuizzesPage />} />
                <Route path="employers" element={<EmployersPage />} />
                <Route path="jobportal" element={<JobsPage />} />
                <Route path="reports" element={<Reports />} />
                <Route path="auditlog" element={<AuditLog />} />
                <Route path="updation" element={<Updation />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['sub_admin']} />}>
              <Route path="/sub-admin" element={<SubAdminLayout />}>
                <Route path="dashboard" element={<div>Sub-Admin Dashboard — coming soon</div>} />
              </Route>
            </Route>

            <Route path="*" element={<CatchAll />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
