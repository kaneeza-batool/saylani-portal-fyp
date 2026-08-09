import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';
import LoginPage from './pages/LoginPage';
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
import OnboardingPage from './pages/OnboardingPage';

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

            <Route element={<ProtectedRoute />}>
              {/* Mandatory profile-picture step — standalone, no Sidebar/TopBar,
                  same pattern as quiz-taking below. ProtectedRoute redirects
                  here until it's done, and away from here once it is. */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              <Route element={<StudentLayout />}>
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/dashboard/:courseId" element={<DashboardPage />} />
                <Route path="/progress/:courseId" element={<ProgressPage />} />
                <Route path="/attendance/:courseId" element={<AttendancePage />} />
                <Route path="/fee/:courseId" element={<PaymentPage />} />
                <Route path="/assignment/:courseId" element={<AssignmentPage />} />
                <Route path="/quiz/:courseId" element={<QuizListPage />} />
                <Route path="/leaderboard/:courseId" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Quiz-taking runs outside the sidebar shell — distraction-free
                  fullscreen proctored experience, per Integrity Mode. */}
              <Route path="/quiz/:courseId/take/:quizId" element={<QuizTakingPage />} />
              <Route path="/quiz/:courseId/result/:attemptId" element={<QuizResultPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/courses" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
