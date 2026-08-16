import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import logo from '/images/logo/titan-logo-clean.png';
import { useAuth } from '../context/AuthContext';
import { useCourseId } from '../hooks/useCourseId';
import { getAttendanceStreak } from '../services/attendanceService';
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
  BookOpenIcon,
  MessageCircleIcon,
  BriefcaseIcon,
  ChevronUpDownIcon,
  FlameIcon,
  CloseIcon,
  BotIcon,
} from './icons';

const MILESTONES = [60, 30, 7];

function highestMilestone(streak) {
  return MILESTONES.find((m) => streak >= m) || null;
}

const MotionNavLink = motion.create(NavLink);

// `base` is the route segment before :courseId — actual links are built as
// `${base}/${courseId}` once we know which course is in scope (see
// useCourseId). NAV_LOOKUP (keyed by base) lets TopBar's breadcrumb resolve
// a page label from the current pathname's first segment. "Courses" is
// deliberately NOT in this list — it's the one nav item that never needs a
// courseId, so it's rendered separately above these as the student's
// always-available way back to the course picker (see Sidebar below).
//
// Dashboard, Progress, Attendance, Payment, Assignment, Quiz, Resources, and
// Ask a Doubt are all `courseless` — one course per student now (see
// Student.js/attendanceController/feeController/assignmentController/
// quizController/resourceController/questionController/progressController),
// so those eight link straight to `base` with no id segment and are never
// gated on hasActiveCourse. Certificate is the one holdout still keyed by a
// real Course ObjectId (via CourseModule.courseId), which nothing populates
// for a real student anymore — it stays reachable only from the Progress/
// Dashboard certificate banners once a module actually has one, not from
// this list.
export const NAV_ITEMS = [
  { label: 'Dashboard', base: '/dashboard', icon: DashboardIcon, courseless: true },
  { label: 'Progress', base: '/progress', icon: ProgressIcon, courseless: true },
  { label: 'Attendance', base: '/attendance', icon: AttendanceIcon, courseless: true },
  { label: 'Payment', base: '/fee', icon: PaymentIcon, courseless: true },
  { label: 'Assignment', base: '/assignment', icon: AssignmentIcon, courseless: true },
  { label: 'Quiz', base: '/quiz', icon: QuizIcon, courseless: true },
  { label: 'Resources', base: '/resources', icon: BookOpenIcon, courseless: true },
  { label: 'Ask a Doubt', base: '/doubts', icon: MessageCircleIcon, courseless: true },
  { label: 'TITAN Assistant', base: '/assistant', icon: BotIcon, courseless: true },
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

export default function Sidebar({ open, onClose, onMilestone }) {
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
    queryKey: ['attendance', 'streak'],
    queryFn: () => getAttendanceStreak(),
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
    // `milestone` (7/30/60) only decides WHEN this fires (crossing a
    // threshold tier) — the number actually shown must be the live
    // `streak` value, same as the sidebar card and the confetti overlay
    // below, so all three always agree for the current course.
    onMilestone?.({
      icon: <FlameIcon className="w-5 h-5 text-accent-400 shrink-0" />,
      title: `${streak}-day streak!`,
      message: `You've attended ${streak} classes in a row. Keep the momentum going.`,
    });
  }, [milestone, streak, onMilestone]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

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

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 flex flex-col gap-1">
        {/* "Home base" — always visible, always goes to /courses, regardless
            of which course (if any) is currently active. */}
        <MotionNavLink
          to="/courses"
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            onCoursesPage
              ? 'bg-accent-500 text-primary-900 font-semibold'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CoursesIcon className="w-5 h-5" />
          Courses
        </MotionNavLink>

        {/* Lifetime, cross-course view — like Courses, never needs a
            :courseId, so it lives up here rather than in the per-course
            NAV_ITEMS list below. */}
        <MotionNavLink
          to="/skill-passport"
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === '/skill-passport'
              ? 'bg-accent-500 text-primary-900 font-semibold'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <BriefcaseIcon className="w-5 h-5" />
          Skill Passport
        </MotionNavLink>

        <div className="h-px bg-white/10 my-1" />

        {NAV_ITEMS.map(({ label, base, icon: Icon, courseless }) => {
          if (!courseless && !hasActiveCourse) {
            return (
              <span
                key={base}
                title="Select a course first"
                aria-disabled="true"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/70 opacity-40 cursor-not-allowed select-none pointer-events-none"
              >
                <Icon className="w-5 h-5" />
                {label}
              </span>
            );
          }

          const to = courseless ? base : `${base}/${courseId}`;
          // isActive judged from the real pathname (not NavLink's own
          // matching) so exactly one item lights up once a course is active.
          // Ask a Doubt is courseless but still has a `/doubts/:questionId`
          // detail route inside the sidebar shell, so an exact match alone
          // would leave the nav item dark on that page.
          const isActive = courseless ? pathname === base || pathname.startsWith(`${base}/`) : pathname.startsWith(`${base}/`);
          return (
            <MotionNavLink
              key={base}
              to={to}
              onClick={onClose}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-500 text-primary-900 font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </MotionNavLink>
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
            {/* Same containing-block issue as Confetti (the aside's
                transform), so this also has to portal to document.body
                rather than render as a normal fixed-position child here.
                Anchored bottom-left, near the streak card that triggered it
                (and, on desktop, within/just past the sidebar's own
                column) — deliberately NOT top-center, which sat directly
                over every page's title/heading area. */}
            {createPortal(
              <div className="fixed bottom-6 left-4 lg:left-[276px] z-[81] pointer-events-none">
                <div
                  data-testid="streak-celebration"
                  className="bg-primary-900 text-white rounded-lg shadow-modal px-5 py-3 border border-accent-500/50 flex items-center gap-2.5"
                >
                  <FlameIcon className="w-5 h-5 text-accent-400 shrink-0" />
                  <p className="font-heading font-bold text-sm sm:text-base whitespace-nowrap">
                    {streak} days strong! Keep it up
                  </p>
                </div>
              </div>,
              document.body
            )}
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
      </aside>
    </>
  );
}
