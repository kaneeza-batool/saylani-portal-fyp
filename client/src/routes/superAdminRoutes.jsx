// Super-admin route subtree — extracted verbatim from App.jsx.
// Import this constant and place {SuperAdminRoutes} inside <Routes> in App.jsx.
// Do NOT use it as <SuperAdminRoutes /> — React Router requires Route elements,
// not arbitrary components, as direct children of <Routes>.

import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import DashboardPage from '../portals/super-admin/DashboardPage';
import StudentsPage from '../portals/super-admin/StudentsPage';
import CampusesPage from '../portals/super-admin/CampusesPage';
import SubAdminsPage from '../portals/super-admin/SubAdminsPage';
import TrainersPage from '../portals/super-admin/TrainersPage';
import TrainersAttendanceMark from '../portals/super-admin/trainers/TrainersAttendanceMark';
import TrainersAttendanceView from '../portals/super-admin/trainers/TrainersAttendanceView';
import TrainersAttendanceRequest from '../portals/super-admin/trainers/TrainersAttendanceRequest';
import CoursesPage from '../portals/super-admin/CoursesPage';
import MarkAttendance from '../portals/super-admin/attendance/MarkAttendance';
import ViewAttendance from '../portals/super-admin/attendance/ViewAttendance';
import MultiAttendance from '../portals/super-admin/attendance/MultiAttendance';
import SlotsPage from '../portals/super-admin/administration/SlotsPage';
import QuizzesPage from '../portals/super-admin/QuizzesPage';
import EmployersPage from '../portals/super-admin/EmployersPage';
import JobsPage from '../portals/super-admin/JobsPage';
import Reports from '../portals/super-admin/Reports';
import AuditLog from '../portals/super-admin/AuditLog';
import Updation from '../portals/super-admin/Updation';
import Settings from '../portals/super-admin/Settings';
import Profile from '../portals/super-admin/Profile';

const SuperAdminRoutes = (
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
);

export default SuperAdminRoutes;
