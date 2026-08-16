import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { getRoleHome } from './utils/roleHome';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import TrainerRegisterPage from './pages/TrainerRegisterPage';
import PublicLayout from './layouts/PublicLayout';
import DonorPublicLayout from './layouts/DonorPublicLayout';
import CareersPage from './pages/public/CareersPage';
import JobDetailPage from './pages/public/JobDetailPage';
import JobApplyPage from './pages/public/JobApplyPage';
import StatusCheckPage from './pages/public/StatusCheckPage';
import DonatePage from './pages/public/DonatePage';
import CampaignDetailPage from './pages/public/CampaignDetailPage';
import DonateFormPage from './pages/public/DonateFormPage';
import DonationStatusPage from './pages/public/DonationStatusPage';
import DonorWallPage from './pages/public/DonorWallPage';
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
import JobApplicationsPage from './portals/super-admin/JobApplicationsPage';
import CampaignsPage from './portals/super-admin/CampaignsPage';
import DonationsPage from './portals/super-admin/DonationsPage';
import Reports from './portals/super-admin/Reports';
import AuditLog from './portals/super-admin/AuditLog';
import Updation from './portals/super-admin/Updation';
import Settings from './portals/super-admin/Settings';
import Profile from './portals/super-admin/Profile';
import InsightsPage from './portals/super-admin/InsightsPage';
import CampusMapPage from './portals/super-admin/CampusMapPage';
import AlertsPage from './portals/super-admin/AlertsPage';
import SubAdminDashboardPage from './portals/sub-admin/DashboardPage';
import AdmissionsQueuePage from './portals/sub-admin/AdmissionsQueuePage';
import SubAdminTrainersPage from './portals/sub-admin/TrainersPage';
import SubAdminBatchesPage from './portals/sub-admin/BatchesPage';
import SubAdminStudentsPage from './portals/sub-admin/StudentsPage';
import SubAdminAttendanceReportsPage from './portals/sub-admin/AttendanceReportsPage';
import SubAdminFeedbackPage from './portals/sub-admin/FeedbackPage';
import FeesPage from './portals/sub-admin/FeesPage';
import SubAdminAlertsPage from './portals/sub-admin/AlertsPage';
import SubAdminAuditLogPage from './portals/sub-admin/AuditLogPage';
import SubAdminAttendanceRequestsPage from './portals/sub-admin/AttendanceRequestsPage';
import StudentFeedbackPage from './portals/super-admin/StudentFeedbackPage';
import RolesPermissionsPage from './portals/super-admin/RolesPermissionsPage';
import SubAdminStudentFeedbackPage from './portals/sub-admin/StudentFeedbackPage';
import TrainerLayout from './layouts/TrainerLayout';
import TrainerDashboardPage from './portals/trainer/DashboardPage';
import TrainerBatchesPage from './portals/trainer/BatchesPage';
import TrainerAttendancePage from './portals/trainer/AttendancePage';
import TrainerQuizzesPage from './portals/trainer/QuizzesPage';
import TrainerStudentsPage from './portals/trainer/StudentsPage';
import TrainerResourcesPage from './portals/trainer/ResourcesPage';
import TrainerProfilePage from './portals/trainer/ProfilePage';

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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/trainer/register" element={<TrainerRegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                <Route element={<PublicLayout />}>
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/careers/status" element={<StatusCheckPage />} />
                  <Route path="/careers/:id" element={<JobDetailPage />} />
                  <Route path="/careers/:id/apply" element={<JobApplyPage />} />
                </Route>

                <Route element={<DonorPublicLayout />}>
                  <Route path="/donate" element={<DonatePage />} />
                  <Route path="/donate/status" element={<DonationStatusPage />} />
                  <Route path="/donate/wall" element={<DonorWallPage />} />
                  <Route path="/donate/:id" element={<CampaignDetailPage />} />
                  <Route path="/donate/:id/give" element={<DonateFormPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/admin" element={<SuperAdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
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
                    <Route path="jobportal/applications" element={<JobApplicationsPage />} />
                    <Route path="donorportal/campaigns" element={<CampaignsPage />} />
                    <Route path="donorportal/donations" element={<DonationsPage />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="auditlog" element={<AuditLog />} />
                    <Route path="updation" element={<Updation />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="insights" element={<InsightsPage />} />
                    <Route path="campus-map" element={<CampusMapPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
                    <Route path="admissions" element={<AdmissionsQueuePage />} />
                    <Route path="student-feedback" element={<StudentFeedbackPage />} />
                    <Route path="roles-permissions" element={<RolesPermissionsPage />} />
                    <Route path="fees" element={<FeesPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'sub_admin']} />}>
                  <Route path="/admin" element={<SuperAdminLayout />}>
                    <Route path="profile" element={<Profile />} />
                    <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                      <Route path="students" element={<StudentsPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['sub_admin']} />}>
                  <Route path="/sub-admin" element={<SubAdminLayout />}>
                    <Route path="dashboard" element={<SubAdminDashboardPage />} />
                    <Route path="students" element={<SubAdminStudentsPage />} />
                    <Route path="admissions" element={<AdmissionsQueuePage />} />
                    <Route path="trainers" element={<SubAdminTrainersPage />} />
                    <Route path="batches" element={<SubAdminBatchesPage />} />
                    <Route path="attendance-reports" element={<SubAdminAttendanceReportsPage />} />
                    <Route path="attendance-requests" element={<SubAdminAttendanceRequestsPage />} />
                    <Route path="student-feedback" element={<SubAdminStudentFeedbackPage />} />
                    {/* Same components super-admin uses at /admin/attendance/mark|multi —
                        no sub-admin-specific fork needed, they were already portable
                        (no role checks); the backend enforces campus scope. */}
                    <Route path="attendance/mark" element={<MarkAttendance />} />
                    <Route path="attendance/multi" element={<MultiAttendance />} />
                    <Route path="feedback" element={<SubAdminFeedbackPage />} />
                    <Route path="fees" element={<FeesPage />} />
                    <Route path="alerts" element={<SubAdminAlertsPage />} />
                    <Route path="audit-log" element={<SubAdminAuditLogPage />} />
                    {/* Same reusable Profile component super-admin uses at /admin/profile —
                        it's already role-agnostic (just getMe/updateMe), rendered here so
                        the URL and shell nav stay inside SubAdminLayout instead of borrowing
                        SuperAdminLayout. */}
                    <Route path="profile" element={<Profile />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
                  <Route path="/trainer" element={<TrainerLayout />}>
                    <Route index element={<Navigate to="/trainer/dashboard" replace />} />
                    <Route path="dashboard" element={<TrainerDashboardPage />} />
                    <Route path="batches" element={<TrainerBatchesPage />} />
                    <Route path="attendance" element={<TrainerAttendancePage />} />
                    <Route path="quizzes" element={<TrainerQuizzesPage />} />
                    <Route path="students" element={<TrainerStudentsPage />} />
                    <Route path="resources" element={<TrainerResourcesPage />} />
                    <Route path="profile" element={<TrainerProfilePage />} />
                  </Route>
                </Route>

                <Route path="*" element={<CatchAll />} />
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
