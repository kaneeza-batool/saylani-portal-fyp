import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CoursesPage from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
import ProgressPage from './pages/ProgressPage';
import AttendancePage from './pages/AttendancePage';
import PaymentPage from './pages/PaymentPage';
import AssignmentPage from './pages/AssignmentPage';
import QuizListPage from './pages/QuizListPage';
import QuizTakingPage from './pages/QuizTakingPage';
import QuizResultPage from './pages/QuizResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import CertificatePage from './pages/CertificatePage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import MyFeedbackPage from './pages/MyFeedbackPage';
import OnboardingPage from './pages/OnboardingPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AgendaPage from './pages/AgendaPage';
import ResourceLibraryPage from './pages/ResourceLibraryPage';
import SkillPassportPage from './pages/SkillPassportPage';
import DoubtsListPage from './pages/DoubtsListPage';
import DoubtDetailPage from './pages/DoubtDetailPage';
import AskTitanPage from './pages/AskTitanPage';

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* PUBLIC — no auth, no Sidebar/TopBar. Anyone with the link
                (e.g. an employer) must be able to open this while logged
                out, so it lives entirely outside ProtectedRoute. */}
            <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />

            <Route element={<ProtectedRoute />}>
              {/* Mandatory profile-picture step — standalone, no Sidebar/TopBar,
                  same pattern as quiz-taking below. ProtectedRoute redirects
                  here until it's done, and away from here once it is. */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Standalone, same reasoning as /onboarding above — where a
                  student with student.portalAccess === false ends up after
                  onboarding, until an admin approves their admission. */}
              <Route path="/pending-approval" element={<PendingApprovalPage />} />

              <Route element={<StudentLayout />}>
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/fee" element={<PaymentPage />} />
                <Route path="/assignment" element={<AssignmentPage />} />
                <Route path="/quiz" element={<QuizListPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/certificate" element={<CertificatePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/feedback" element={<MyFeedbackPage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/resources" element={<ResourceLibraryPage />} />
                <Route path="/skill-passport" element={<SkillPassportPage />} />
                <Route path="/doubts" element={<DoubtsListPage />} />
                <Route path="/doubts/:questionId" element={<DoubtDetailPage />} />
                <Route path="/assistant" element={<AskTitanPage />} />
              </Route>

              {/* Quiz-taking runs outside the sidebar shell — distraction-free
                  fullscreen proctored experience, per Integrity Mode. */}
              <Route path="/quiz/take/:quizId" element={<QuizTakingPage />} />
              <Route path="/quiz/result/:attemptId" element={<QuizResultPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/courses" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
