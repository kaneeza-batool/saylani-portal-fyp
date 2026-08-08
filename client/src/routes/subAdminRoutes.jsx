// Sub-admin route subtree.
// Import this constant and place {SubAdminRoutes} inside <Routes> in App.jsx.
// Do NOT use it as <SubAdminRoutes /> — React Router requires Route elements,
// not arbitrary components, as direct children of <Routes>.

import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import SubAdminLayout from '../layouts/SubAdminLayout';
import SubAdminDashboard from '../portals/sub-admin/DashboardPage';
import AdmissionsPage from '../portals/sub-admin/AdmissionsPage';
import SubAdminStudentsPage from '../portals/sub-admin/StudentsPage';
import SubAdminTrainersPage from '../portals/sub-admin/TrainersPage';
import BatchesPage from '../portals/sub-admin/BatchesPage';
import AttendancePage from '../portals/sub-admin/AttendancePage';
import FeedbackPage from '../portals/sub-admin/FeedbackPage';

const SubAdminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={['sub_admin']} />}>
    <Route path="/sub-admin" element={<SubAdminLayout />}>
      <Route index element={<Navigate to="/sub-admin/dashboard" replace />} />
      <Route path="dashboard" element={<SubAdminDashboard />} />
      <Route path="admissions" element={<AdmissionsPage />} />
      <Route path="students" element={<SubAdminStudentsPage />} />
      <Route path="trainers" element={<SubAdminTrainersPage />} />
      <Route path="batches" element={<BatchesPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="feedback" element={<FeedbackPage />} />
    </Route>
  </Route>
);

export default SubAdminRoutes;
