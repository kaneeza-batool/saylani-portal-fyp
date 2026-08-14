import { Routes, Route, Outlet } from 'react-router-dom';
import PublicLayout from '../../layout/public/PublicLayout';
import AdminLayout from '../../layout/admin/AdminLayout';
import { AdminAuthProvider } from '../../context/AdminAuthContext';
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminCourseForm from '../../pages/admin/AdminCourseForm';
import Home from '../../pages/public/Home';
import About from '../../pages/public/About';
import Programs from '../../pages/public/Programs';
import CourseDetail from '../../pages/public/CourseDetail';
import FindYourPath from '../../pages/public/FindYourPath';
import Campuses from '../../pages/public/Campuses';
import SuccessStories from '../../pages/public/SuccessStories';
import Contact from '../../pages/public/Contact';
import EnrollNow from '../../pages/public/EnrollNow';
import Login from '../../pages/public/Login';
import VerifyCertificate from '../../pages/public/VerifyCertificate';
import EntryTestStatus from '../../pages/public/EntryTestStatus';
import CheckResult from '../../pages/public/CheckResult';
import DownloadIdCard from '../../pages/public/DownloadIdCard';
import PrivacyPolicy from '../../pages/public/PrivacyPolicy';
import TermsOfService from '../../pages/public/TermsOfService';
import NotFound from '../../pages/public/NotFound';

// AdminAuthProvider fires a GET /api/admin/auth/me check on mount — scoping
// it to just the /admin/* subtree (instead of the whole app) keeps public
// pages from firing a doomed-to-401 admin session check on every load.
const AdminRoot = () => (
  <AdminAuthProvider>
    <Outlet />
  </AdminAuthProvider>
);

const PublicRoutes = () => {
  return (
    <Routes>
      {/* All Public Pages wrapped inside the Main Layout Wrapper */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/programs/:slug" element={<CourseDetail />} />
        <Route path="/find-your-path" element={<FindYourPath />} />
        <Route path="/campuses" element={<Campuses />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/entry-test-status" element={<EntryTestStatus />} />
        <Route path="/check-result" element={<CheckResult />} />
        <Route path="/download-id-card" element={<DownloadIdCard />} />

        {/* Legal Pages connected via Footer */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Placeholder paths to avoid application crashing */}
        <Route path="/apply" element={<EnrollNow />} />
        <Route path="/registry" element={<div className="py-20 text-center text-sm font-medium text-neutral-500">Academic Registry coming soon.</div>} />

        {/* 404 — kept inside the layout so a mistyped URL still leaves Navbar/Footer navigation available */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Standalone — no Navbar/Footer, matching Student Portal's own login page chrome */}
      <Route path="/login" element={<Login />} />

      {/* Admin Dashboard — standalone login, sidebar layout for everything else. Not
          connected to Student Portal / Super Admin auth; its own single admin account. */}
      <Route path="/admin" element={<AdminRoot />}>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="courses/new" element={<AdminCourseForm />} />
          <Route path="courses/:id/edit" element={<AdminCourseForm />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default PublicRoutes;
