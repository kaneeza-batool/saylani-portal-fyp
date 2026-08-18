import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchStudents } from '../../services/studentService';
import { fetchSlots } from '../../services/slotService';
import { getAdmissions, approveAdmission, rejectAdmission } from '../../services/admissionService';
import { getAttendanceSummary } from '../../services/studentAttendanceService';
import { GraduationCapIcon, HourglassIcon, BookIcon, CalendarIcon } from '../../components/icons';

const PREVIEW_LIMIT = 5;

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

// Mirrors super-admin/DashboardPage.jsx's card pattern (CardShell, KpiCard,
// skeleton, motion variants) rather than sharing a component — this
// codebase keeps each page's presentational pieces local (see the repeated
// initials()/roleLabel() helpers elsewhere), so this follows that instead
// of introducing a new shared-component pattern.

const KPI_ICON = {
  students: { bg: 'bg-success-bg', color: 'text-success-text', Icon: GraduationCapIcon },
  admissions: { bg: 'bg-warning-bg', color: 'text-warning-text', Icon: HourglassIcon },
  batches: { bg: 'bg-info-bg', color: 'text-info-text', Icon: BookIcon },
  attendance: { bg: 'bg-danger-50', color: 'text-danger-600', Icon: CalendarIcon },
};

const TAG_TONE = {
  live: 'bg-info-bg text-info-text',
  pending: 'bg-neutral-100 text-neutral-500',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

function CardShell({ children, className = '' }) {
  return (
    <motion.div variants={fadeInUp} className={`bg-surface border border-neutral-200 rounded-xl ${className}`}>
      {children}
    </motion.div>
  );
}

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-neutral-100 rounded animate-pulse ${className}`} />;
}

function KpiCard({ label, value, icon, tag, loading }) {
  const iconStyle = KPI_ICON[icon] ?? KPI_ICON.students;
  const Icon = iconStyle.Icon;
  return (
    <CardShell className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-overline uppercase text-neutral-500">{label}</span>
        <div className={`w-[34px] h-[34px] rounded flex items-center justify-center ${iconStyle.bg} ${iconStyle.color}`}>
          <Icon width="17" height="17" />
        </div>
      </div>
      {loading ? (
        <SkeletonBlock className="h-7 w-16" />
      ) : (
        <div className="font-heading text-h3 text-neutral-900">{value}</div>
      )}
      <span className={`text-badge px-2 py-0.5 rounded-pill w-fit ${TAG_TONE[tag.tone]}`}>{tag.label}</span>
    </CardShell>
  );
}

const BATCH_OVERVIEW_LIMIT = 5;

// Course/batch name on the left, trainer + studentCount right-aligned on
// the same line, capacity bar underneath. studentCount comes from
// slotRoutes.js's withStudentCounts annotate hook (same field BatchesPage
// uses) — no separate aggregation here. seatsTotal is Slot's capacity field
// (required, min 1 — confirmed no existing Slot lacks it), so denominator
// is never 0/undefined for real data; still guarded defensively.
function BatchOverview({ batches, isLoading, isError }) {
  const list = batches ?? [];

  return (
    <CardShell className="p-[22px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h6 text-neutral-900">Batch Overview</div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-body-sm text-danger-600">Couldn't load batches.</div>
      ) : list.length === 0 ? (
        <div className="text-body-sm text-neutral-400">No active batches yet.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3.5">
          {list.map((b) => {
            const pct = b.seatsTotal > 0 ? Math.min(100, Math.round((b.studentCount / b.seatsTotal) * 100)) : 0;
            return (
              <motion.div key={b._id} variants={fadeInUp} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-body-sm font-semibold text-neutral-900 truncate">
                    {b.course} · {b.schedule}
                  </span>
                  <span className="text-caption text-neutral-500 font-normal shrink-0">
                    {b.trainer} · {b.studentCount}/{b.seatsTotal}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-pill overflow-hidden">
                  <div className="h-full bg-gold-500 rounded-pill" style={{ width: `${pct}%` }} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </CardShell>
  );
}

function PendingAdmissions({ admissions, isLoading, isError, actionMutation, isButtonPending, onViewAll }) {
  const applicants = admissions ?? [];

  return (
    <CardShell className="p-[22px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="font-heading font-bold text-h6 text-neutral-900">Pending Admissions</div>
        <button
          type="button"
          onClick={onViewAll}
          className="border-none bg-transparent text-caption font-semibold text-gold-600 cursor-pointer hover:text-gold-700 transition-colors px-2 py-1"
        >
          View all →
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-body-sm text-danger-600">Couldn't load admissions.</div>
      ) : applicants.length === 0 ? (
        <div className="text-body-sm text-neutral-400">No pending admissions.</div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-2">
          {applicants.map((a) => (
            <motion.div
              key={a._id}
              variants={fadeInUp}
              className="flex items-center justify-between gap-3 p-3 border border-neutral-100 rounded-lg flex-wrap"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold text-neutral-900 truncate">{a.name}</span>
                <span className="text-caption text-neutral-500 font-normal">{a.course}</span>
                <span className="text-badge text-neutral-400 font-normal">Applied {fmtDate(a.createdAt)}</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key="actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 shrink-0"
                >
                  <button
                    type="button"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id: a._id, action: 'approve' })}
                    className="border-none bg-gold-500 text-white text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isButtonPending(a._id, 'approve') ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id: a._id, action: 'reject' })}
                    className="border border-danger-200 bg-surface text-danger-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-danger-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isButtonPending(a._id, 'reject') ? 'Rejecting...' : 'Reject'}
                  </button>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}
    </CardShell>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // roster: 'active' (not the sitewide-standard 'true') — this KPI
  // deliberately excludes dropout too, unlike every other "Students" count
  // in the app (super-admin Dashboard, Reports, Campus Map), by explicit
  // request: a sub-admin dropping a student out should see this number
  // move immediately, not stay flat because dropout still counts as roster.
  const students = useQuery({
    queryKey: ['sub-admin-dashboard-students'],
    queryFn: () => fetchStudents({ limit: 1, roster: 'active' }),
  });

  // limit bumped from 1 to BATCH_OVERVIEW_LIMIT (5) so this same query also
  // supplies the Batch Overview panel's rows — `total` (used by the KPI
  // card below) is a server-side count independent of `limit`, so raising
  // it doesn't change the KPI value, just adds `items` the panel can use
  // instead of firing a second request.
  const batches = useQuery({
    queryKey: ['sub-admin-dashboard-batches'],
    queryFn: () => fetchSlots({ status: 'active', limit: BATCH_OVERVIEW_LIMIT }),
  });

  const admissions = useQuery({
    queryKey: ['admissions'],
    queryFn: () => getAdmissions({ limit: PREVIEW_LIMIT }),
  });

  const attendance = useQuery({
    queryKey: ['sub-admin-dashboard-attendance-summary'],
    queryFn: getAttendanceSummary,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => (action === 'approve' ? approveAdmission(id) : rejectAdmission(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      // Approving/rejecting moves a student in or out of the roster — the
      // Students KPI card on this same page needs to reflect it too.
      queryClient.invalidateQueries({ queryKey: ['sub-admin-dashboard-students'] });
    },
  });

  const isButtonPending = (id, action) =>
    actionMutation.isPending && actionMutation.variables?.id === id && actionMutation.variables?.action === action;

  const anyError = students.isError || batches.isError || admissions.isError || attendance.isError;
  const retryAll = () => {
    if (students.isError) students.refetch();
    if (batches.isError) batches.refetch();
    if (admissions.isError) admissions.refetch();
    if (attendance.isError) attendance.refetch();
  };

  const attendancePct = attendance.data?.percentage;
  const attendanceValue = attendancePct == null ? '—' : `${attendancePct}%`;
  const attendanceTag = attendance.isError
    ? { label: 'Failed to load', tone: 'pending' }
    : attendancePct == null
      ? { label: 'No data yet', tone: 'pending' }
      : { label: 'Last 30 days', tone: 'live' };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Students"
          value={(students.data?.total ?? 0).toLocaleString()}
          icon="students"
          loading={students.isLoading}
          tag={students.isError ? { label: 'Failed to load', tone: 'pending' } : { label: 'This campus', tone: 'live' }}
        />
        <KpiCard
          label="Pending Admissions"
          value={(admissions.data?.total ?? 0).toLocaleString()}
          icon="admissions"
          loading={admissions.isLoading}
          tag={admissions.isError ? { label: 'Failed to load', tone: 'pending' } : { label: 'This campus', tone: 'live' }}
        />
        <KpiCard
          label="Active Batches"
          value={(batches.data?.total ?? 0).toLocaleString()}
          icon="batches"
          loading={batches.isLoading}
          tag={batches.isError ? { label: 'Failed to load', tone: 'pending' } : { label: 'This campus', tone: 'live' }}
        />
        <KpiCard
          label="Avg Attendance"
          value={attendanceValue}
          icon="attendance"
          loading={attendance.isLoading}
          tag={attendanceTag}
        />
      </div>

      {anyError && (
        <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex items-center justify-between">
          <span className="text-body-sm text-danger-600">Couldn't load some dashboard stats. Please try again.</span>
          <button
            type="button"
            onClick={retryAll}
            className="border-none bg-gold-500 text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:bg-gold-600"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingAdmissions
          admissions={admissions.data?.students}
          isLoading={admissions.isLoading}
          isError={admissions.isError}
          actionMutation={actionMutation}
          isButtonPending={isButtonPending}
          onViewAll={() => navigate('/sub-admin/admissions')}
        />
        <BatchOverview batches={batches.data?.items} isLoading={batches.isLoading} isError={batches.isError} />
      </div>
    </motion.div>
  );
}
