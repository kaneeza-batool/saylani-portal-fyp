import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
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
import InsightsPage from './portals/super-admin/InsightsPage';
import CampusMapPage from './portals/super-admin/CampusMapPage';
import AlertsPage from './portals/super-admin/AlertsPage';
import TrainerLayout from './layouts/TrainerLayout';
import TrainerDashboardPage from './portals/trainer/DashboardPage';
import TrainerBatchesPage from './portals/trainer/BatchesPage';
import TrainerAttendancePage from './portals/trainer/AttendancePage';
import TrainerQuizzesPage from './portals/trainer/QuizzesPage';
import TrainerStudentsPage from './portals/trainer/StudentsPage';
import TrainerProfilePage from './portals/trainer/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

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
                    <Route path="insights" element={<InsightsPage />} />
                    <Route path="campus-map" element={<CampusMapPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
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
                    <Route path="profile" element={<TrainerProfilePage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
