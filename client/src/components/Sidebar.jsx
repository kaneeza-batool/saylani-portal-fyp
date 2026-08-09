import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import logo from '/images/logo/titan-logo-clean.png';
import { useAuth } from '../context/AuthContext';
import { useCourseId } from '../hooks/useCourseId';
import { getAttendanceStreak } from '../services/attendanceService';
import Toast from './Toast';
import ProfileMenu from './ProfileMenu';
import Confetti from './Confetti';
import {
  CoursesIcon,
  DashboardIcon,
  ProgressIcon,
  AttendanceIcon,
  PaymentIcon,
  AssignmentIcon,
  QuizIcon,
  ChevronUpDownIcon,
  FlameIcon,
  CloseIcon,
} from './icons';

const MILESTONES = [60, 30, 7];

function highestMilestone(streak) {
  return MILESTONES.find((m) => streak >= m) || null;
}

// `base` is the route segment before :courseId — actual links are built as
// `${base}/${courseId}` once we know which course is in scope (see
// useCourseId). NAV_LOOKUP (keyed by base) lets TopBar's breadcrumb resolve
// a page label from the current pathname's first segment. "Courses" is
// deliberately NOT in this list — it's the one nav item that never needs a
// courseId, so it's rendered separately above these as the student's
// always-available way back to the course picker (see Sidebar below).
export const NAV_ITEMS = [
  { label: 'Dashboard', base: '/dashboard', icon: DashboardIcon },
  { label: 'Progress', base: '/progress', icon: ProgressIcon },
  { label: 'Attendance', base: '/attendance', icon: AttendanceIcon },
  { label: 'Payment', base: '/fee', icon: PaymentIcon },
  { label: 'Assignment', base: '/assignment', icon: AssignmentIcon },
  { label: 'Quiz', base: '/quiz', icon: QuizIcon },
];

export const NAV_LOOKUP = NAV_ITEMS.reduce((acc, item) => {
  acc[item.base] = item.label;
  return acc;
}, {});

export function initialsOf(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({ open, onClose }) {
  const [toast, setToast] = useState(null);
  const { pathname } = useLocation();
  const { student } = useAuth();
  const courseId = useCourseId();

  // On /courses itself there's no active course in play even if a prior
  // visit left one remembered in localStorage — the course-scoped items
  // (Dashboard, Attendance, ...) should read as unavailable there, not
  // silently link to whatever course the student looked at last.
  const onCoursesPage = pathname === '/courses';
  const hasActiveCourse = Boolean(courseId) && !onCoursesPage;

  const { data: streakData } = useQuery({
    queryKey: ['attendance', 'streak', courseId],
    queryFn: () => getAttendanceStreak(courseId),
    enabled: !!courseId,
  });
  const streak = streakData?.streak ?? null;
  const milestone = streak ? highestMilestone(streak) : null;

  // Lightweight, repeatable delight moment — clicking the streak card fires
  // a confetti burst + encouraging message. No state to persist, can be
  // replayed any time, reuses the same Confetti component as the quiz
  // pass-celebration rather than a second implementation.
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimer = useRef(null);

  function celebrateStreak() {
    if (!streak) return;
    setCelebrating(true);
    clearTimeout(celebrationTimer.current);
    celebrationTimer.current = setTimeout(() => setCelebrating(false), 3200);
  }

  useEffect(() => () => clearTimeout(celebrationTimer.current), []);

  const shownMilestones = useRef(new Set());

  useEffect(() => {
    if (!milestone || shownMilestones.current.has(milestone)) return;
    shownMilestones.current.add(milestone);
    setToast({
      icon: '🔥',
      title: `${milestone}-day streak!`,
      message: `You've attended ${milestone} classes in a row. Keep the momentum going.`,
    });
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [milestone]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-[260px] shrink-0 h-screen bg-primary-900 flex flex-col fixed top-0 left-0 z-50 transform transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <img src={logo} alt="TITAN" className="w-10 h-10 object-contain" />
        <div className="flex-1 min-w-0">
          <p className="font-heading text-white font-bold leading-tight">TITAN</p>
          <p className="text-white/50 text-xs leading-tight">Student Portal</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden text-white/60 hover:text-white p-1"
          aria-label="Close menu"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {/* "Home base" — always visible, always goes to /courses, regardless
            of which course (if any) is currently active. */}
        <NavLink
          to="/courses"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            onCoursesPage
              ? 'bg-accent-500 text-primary-900 font-semibold'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CoursesIcon className="w-5 h-5" />
          Courses
        </NavLink>

        <div className="h-px bg-white/10 my-1" />

        {NAV_ITEMS.map(({ label, base, icon: Icon }) => {
          if (!hasActiveCourse) {
            return (
              <span
                key={base}
                title="Select a course first"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/25 cursor-not-allowed select-none"
              >
                <Icon className="w-5 h-5" />
                {label}
              </span>
            );
          }

          // isActive judged from the real pathname (not NavLink's own
          // matching) so exactly one item lights up once a course is active.
          const isActive = pathname.startsWith(`${base}/`);
          return (
            <NavLink
              key={base}
              to={`${base}/${courseId}`}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-500 text-primary-900 font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={celebrateStreak}
          disabled={!streak}
          data-testid="streak-card"
          className={`rounded-lg border px-3.5 py-3 flex items-center gap-3 transition-shadow text-left ${
            milestone ? 'border-accent-500/50 shadow-glow' : 'border-accent-500/30'
          } bg-accent-500/10 ${streak ? 'hover:bg-accent-500/20 cursor-pointer' : 'cursor-default'}`}
        >
          <FlameIcon className="w-5 h-5 text-accent-400 shrink-0" />
          <div>
            <p className="text-accent-400 text-sm font-bold leading-tight">
              {streak === null ? 'Loading streak...' : `${streak}-day streak`}
            </p>
            <p className="text-white/40 text-xs leading-tight">Keep attending to grow it</p>
          </div>
        </button>

        {celebrating && (
          <>
            <Confetti />
            <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[81] pointer-events-none px-4 w-full flex justify-center">
              <div
                data-testid="streak-celebration"
                className="bg-primary-900 text-white rounded-lg shadow-modal px-5 py-3 border border-accent-500/50 flex items-center gap-2.5"
              >
                <span className="text-2xl leading-none">🔥</span>
                <p className="font-heading font-bold text-sm sm:text-base whitespace-nowrap">
                  {streak} days strong! Keep it up
                </p>
              </div>
            </div>
          </>
        )}

        <ProfileMenu
          direction="up"
          onNavigate={onClose}
          ariaLabel="Account menu"
          triggerClassName="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-white/5 transition-colors"
          panelClassName="left-0 right-0"
          trigger={
            <>
              {student?.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="w-9 h-9 shrink-0 rounded-pill object-cover"
                />
              ) : (
                <span className="w-9 h-9 shrink-0 rounded-pill bg-accent-500 text-primary-900 font-bold text-sm flex items-center justify-center">
                  {initialsOf(student?.fullName || '')}
                </span>
              )}
              <span className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-semibold truncate">{student?.fullName}</p>
                <p className="text-white/40 text-xs truncate">{student?.campus}</p>
              </span>
              <ChevronUpDownIcon className="w-4 h-4 text-white/40 shrink-0" />
            </>
          }
        />
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      </aside>
    </>
  );
}
