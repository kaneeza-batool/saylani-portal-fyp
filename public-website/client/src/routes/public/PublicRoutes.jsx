import { Routes, Route, Outlet } from 'react-router-dom';
import PublicLayout from '../../layout/public/PublicLayout';
import AdminLayout from '../../layout/admin/AdminLayout';
import { AdminAuthProvider } from '../../context/AdminAuthContext';
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminCourseForm from '../../pages/admin/AdminCourseForm';
import EntryTestApplicants from '../../pages/admin/EntryTestApplicants';
import EntryTestApplicantForm from '../../pages/admin/EntryTestApplicantForm';
import AcademicResults from '../../pages/admin/AcademicResults';
import AcademicResultForm from '../../pages/admin/AcademicResultForm';
import StudentIdCards from '../../pages/admin/StudentIdCards';
import StudentIdCardForm from '../../pages/admin/StudentIdCardForm';
import ContactSubmissions from '../../pages/admin/ContactSubmissions';
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
import Registry from '../../pages/public/Registry';
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

        <Route path="/apply" element={<EnrollNow />} />
        <Route path="/registry" element={<Registry />} />

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
          <Route path="entry-test" element={<EntryTestApplicants />} />
          <Route path="entry-test/new" element={<EntryTestApplicantForm />} />
          <Route path="entry-test/:id/edit" element={<EntryTestApplicantForm />} />
          <Route path="results" element={<AcademicResults />} />
          <Route path="results/new" element={<AcademicResultForm />} />
          <Route path="results/:id/edit" element={<AcademicResultForm />} />
          <Route path="id-cards" element={<StudentIdCards />} />
          <Route path="id-cards/new" element={<StudentIdCardForm />} />
          <Route path="id-cards/:id/edit" element={<StudentIdCardForm />} />
          <Route path="contact-submissions" element={<ContactSubmissions />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default PublicRoutes;
