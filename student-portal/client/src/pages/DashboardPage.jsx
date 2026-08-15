import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboardService';
import { StatCard, StatCardSkeleton } from '../components/StatCard';
import { fadeInUp, staggerContainer } from '../lib/motionVariants';
import { CalendarIcon, ClockIcon, CertificateIcon } from '../components/icons';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS = [
  { key: 'assignments', label: 'Assignments' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'events', label: 'Events' },
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(n) {
  return `Rs. ${n.toLocaleString('en-US')}`;
}

function attendanceTone(percentage) {
  if (percentage >= 85) return 'success';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

function dueLabel(daysUntilDue) {
  if (daysUntilDue < 0) return { text: 'Overdue', tone: 'text-danger-text' };
  if (daysUntilDue === 0) return { text: 'Due today', tone: 'text-warning-text' };
  if (daysUntilDue === 1) return { text: 'Due tomorrow', tone: 'text-warning-text' };
  return { text: `Due in ${daysUntilDue} days`, tone: 'text-neutral-500' };
}

function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 h-full animate-pulse ${className}`}>
      <div className="h-4 w-32 bg-neutral-200 rounded" />
      <div className="h-24 w-full bg-neutral-100 rounded mt-4" />
    </div>
  );
}

// Shown once this course's Progress has reached 100% — Enrollment's
// progressPercent cache is already fetched as part of the dashboard call,
// so this reads that directly rather than firing a separate eligibility
// request just to decide whether to show a link.
function CertificateBanner({ courseId, courseName }) {
  return (
    <Link
      to={`/certificate/${courseId}`}
      data-testid="certificate-banner"
      className="flex items-center justify-between gap-3 rounded-lg shadow-card px-5 py-4 bg-primary-900 border border-accent-500/40 text-white hover:bg-primary-800 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CertificateIcon className="w-5 h-5 text-accent-400 shrink-0" />
        <div className="min-w-0">
          <p className="font-heading text-sm sm:text-base font-bold">Certificate Ready</p>
          <p className="hidden sm:block text-xs text-white/60 truncate">
            You've completed {courseName} — your verified certificate is ready.
          </p>
        </div>
      </div>
      <span className="text-xs sm:text-sm font-semibold text-accent-400 shrink-0">View Certificate →</span>
    </Link>
  );
}

function ActiveCourseCard({ course, classDays, isLoading }) {
  if (isLoading) return <CardSkeleton className="lg:col-span-2" />;
  if (!course) return null;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-primary-100 text-primary-800">
            {course.category || course.name}
          </span>
          <h3 className="font-heading text-xl font-bold text-neutral-900 mt-2 truncate">{course.name}</h3>
        </div>
        <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-success-bg text-success-text shrink-0">
          Enrolled
        </span>
      </div>

      {classDays?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {classDays.map((d) => (
            <span
              key={d}
              className="inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold bg-accent-500/10 text-accent-700"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-neutral-700">{course.progressPercent}%</span>
        </div>
        <div className="h-2 rounded-pill bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-accent-500 rounded-pill transition-all"
            style={{ width: `${Math.min(course.progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <div>
          <p className="text-xs text-neutral-400">Batch</p>
          <p className="font-medium text-neutral-800 truncate">{course.batch}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Roll No.</p>
          <p className="font-medium text-neutral-800 truncate">{course.rollNumber}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Campus</p>
          <p className="font-medium text-neutral-800 truncate">{course.campus}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">City</p>
          <p className="font-medium text-neutral-800 truncate">{course.city}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ClassScheduleCard({ classDays, isLoading }) {
  if (isLoading) return <CardSkeleton />;

  const today = WEEK[new Date().getDay()];
  const activeDays = new Set(classDays || []);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-neutral-400" />
        <h3 className="font-heading text-base font-bold text-neutral-900">Class Schedule</h3>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEK.map((day) => {
          const isClassDay = activeDays.has(day);
          const isToday = day === today;
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span
                className={`w-full aspect-square rounded-md flex items-center justify-center text-[11px] font-bold ${
                  isClassDay ? 'bg-accent-500 text-primary-900' : 'bg-neutral-100 text-neutral-400'
                } ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
              >
                {day[0]}
              </span>
              <span className="text-[10px] text-neutral-400">{day}</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-400">
        {activeDays.size > 0 ? `Classes on ${[...activeDays].join(', ')}.` : 'No class days set for this course yet.'}
      </p>
    </motion.div>
  );
}

function FeeTable({ vouchers, isLoading }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-neutral-200">
        <h3 className="font-heading text-lg font-bold text-neutral-900">Fee History</h3>
        <Link to="/fee" className="text-sm font-semibold text-primary-800 hover:text-primary-900">
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="p-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-neutral-500">No fee vouchers yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100">
          {vouchers.map((v) => (
            <div key={v._id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{v.month}</p>
                <p className="text-xs text-neutral-500 mt-0.5">Due {formatDate(v.dueDate)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-neutral-700">{formatAmount(v.amount)}</span>
                <span
                  className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold ${
                    v.status === 'paid' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'
                  }`}
                >
                  {v.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TabsPanel({ tabs, isLoading }) {
  const [active, setActive] = useState('assignments');

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-neutral-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`px-3.5 py-2 text-sm font-semibold rounded-t-md transition-colors ${
              active === tab.key
                ? 'text-primary-800 border-b-2 border-primary-800'
                : 'text-neutral-400 hover:text-neutral-600 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : active === 'assignments' ? (
          tabs.assignments.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">No pending assignments — you're all caught up.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {tabs.assignments.map((a) => {
                const due = dueLabel(a.daysUntilDue);
                return (
                  <Link
                    key={a._id}
                    to="/assignment"
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-neutral-50 rounded-md transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-800 truncate">{a.title}</span>
                    <span className={`text-xs font-semibold shrink-0 ${due.tone}`}>{due.text}</span>
                  </Link>
                );
              })}
            </div>
          )
        ) : active === 'quizzes' ? (
          tabs.quizzes.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">No quizzes waiting for you right now.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {tabs.quizzes.map((q) => (
                <Link
                  key={q._id}
                  to="/quiz"
                  className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-neutral-50 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{q.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{q.module}</p>
                  </div>
                  <span className="text-xs text-neutral-500 flex items-center gap-1.5 shrink-0">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {q.durationMinutes} min
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-neutral-500 text-center py-10">No upcoming events.</p>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { courseId } = useParams();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard(),
  });

  if (dashboardError) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-neutral-500">Couldn't load your dashboard.</p>
        <button
          type="button"
          onClick={() => refetchDashboard()}
          className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex justify-end">
        <Link
          to="/agenda"
          data-testid="my-week-link"
          className="inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-white text-primary-800 border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          My Week →
        </Link>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >
        {dashboardLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Attendance"
              value={`${dashboard.attendance.percentage}%`}
              tone={attendanceTone(dashboard.attendance.percentage)}
            />
            <StatCard label="Assignments" value={`${dashboard.assignment.submitted}/${dashboard.assignment.total}`} />
          </>
        )}
      </motion.div>

      {dashboard?.activeCourse?.progressPercent === 100 && (
        <CertificateBanner courseId={courseId} courseName={dashboard.activeCourse.name} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <ActiveCourseCard course={dashboard?.activeCourse} classDays={dashboard?.classDays} isLoading={dashboardLoading} />
        <ClassScheduleCard classDays={dashboard?.classDays} isLoading={dashboardLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <FeeTable vouchers={dashboard?.recentFees || []} isLoading={dashboardLoading} />
        <TabsPanel tabs={dashboard?.tabs || { assignments: [], quizzes: [], events: [] }} isLoading={dashboardLoading} />
      </div>
    </div>
  );
}
