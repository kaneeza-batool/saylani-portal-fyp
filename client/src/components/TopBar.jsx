import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NAV_LOOKUP, initialsOf } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCourseId } from '../hooks/useCourseId';
import { getEnrolledCourses } from '../services/courseService';
import NotificationBell from './NotificationBell';
import FeedbackModal from './FeedbackModal';
import ProfileMenu from './ProfileMenu';
import { MenuIcon, FeedbackIcon, ChevronDownIcon } from './icons';

function useBreadcrumb() {
  const { pathname } = useLocation();

  if (pathname === '/courses') return [{ label: 'Home' }];
  if (pathname === '/profile') return [{ label: 'Home', to: '/courses' }, { label: 'Profile' }];
  if (pathname === '/notifications') return [{ label: 'Home', to: '/courses' }, { label: 'Notifications' }];

  // Route shape is /<base>/:courseId — the base segment maps to a nav label
  // regardless of which course is currently selected. Which course that is
  // gets its own explicit "Viewing: ..." switcher next to the title (see
  // CourseSwitcher below) rather than being folded into the breadcrumb.
  const base = '/' + pathname.split('/')[1];
  // Leaderboard isn't a Sidebar nav item (reached via the Dashboard card's
  // "View Full Leaderboard" button instead), so it isn't in NAV_LOOKUP.
  const pageLabel = NAV_LOOKUP[base] ?? (base === '/leaderboard' ? 'Leaderboard' : 'Page');
  return [{ label: 'Home', to: '/courses' }, { label: pageLabel }];
}

// Always-visible indicator of which course's data is currently on screen —
// doubles as the course-switcher via a dropdown of the student's enrolled
// courses. Picking a different course stays on the SAME page type (e.g.
// Assignment -> Assignment) by swapping only the :courseId segment of the
// current path, rather than bouncing to the /courses picker. Hidden on
// /courses itself (nothing to be "viewing" there) and when no course has
// ever been selected (courseId null).
function CourseSwitcher({ courseName, courseId, courses }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/courses' || !courseId) return null;

  // Route shape is /<base>/:courseId — swap just the id segment so the
  // student lands on the same page type for the newly-picked course.
  const segments = pathname.split('/');

  function switchTo(newCourseId) {
    setOpen(false);
    if (newCourseId === courseId) return;
    segments[2] = newCourseId;
    navigate(segments.join('/'));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Switch course"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-pill pl-3 pr-2.5 py-1.5 text-xs sm:text-sm font-semibold bg-primary-50 text-primary-800 border border-primary-100 hover:bg-primary-100 transition-colors shrink-0"
      >
        Viewing: {courseName || 'Course'}
        <ChevronDownIcon className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-modal border border-neutral-200 overflow-hidden z-30">
          {(courses || []).map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => switchTo(c._id)}
              className={`w-full text-left flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm transition-colors ${
                c._id === courseId
                  ? 'bg-primary-50 text-primary-800 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50 font-medium'
              }`}
            >
              {c.name}
              {c._id === courseId && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopBar({ onMenuClick }) {
  const { student } = useAuth();
  const courseId = useCourseId();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getEnrolledCourses,
  });
  const currentCourse = courses?.find((c) => c._id === courseId);

  const crumbs = useBreadcrumb();
  const pageTitle = crumbs[crumbs.length - 1].label;

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-neutral-600">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={i === crumbs.length - 1 ? 'text-neutral-500' : ''}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-lg sm:text-2xl font-bold text-neutral-900 truncate">{pageTitle}</h1>
            <CourseSwitcher courseName={currentCourse?.name} courseId={courseId} courses={courses} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex items-center gap-2 rounded-md px-2.5 sm:px-4 py-2 text-sm font-semibold bg-white text-neutral-800 border border-neutral-300 transition-colors hover:bg-neutral-50 hover:border-neutral-400"
        >
          <FeedbackIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>

        <NotificationBell />

        <ProfileMenu
          direction="down"
          ariaLabel="Profile menu"
          triggerClassName="shrink-0"
          panelClassName="right-0 w-48"
          trigger={
            student?.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.fullName} className="w-9 h-9 rounded-pill object-cover" />
            ) : (
              <span className="w-9 h-9 rounded-pill bg-primary-800 text-white font-bold text-sm flex items-center justify-center">
                {initialsOf(student?.fullName || '')}
              </span>
            )
          }
        />
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
