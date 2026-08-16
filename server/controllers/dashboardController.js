const Student = require('../models/Student');
const Campus = require('../models/Campus');
const Employer = require('../models/Employer');
const Donation = require('../models/Donation');
const StudentAttendance = require('../models/StudentAttendance');
const AuditLog = require('../models/AuditLog');
const JobApplication = require('../models/JobApplication');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// present/(present+absent) — 'leave' is excluded from the denominator, same
// convention as studentAttendanceController.getAttendanceSummary. Returns
// null (not 0) when there's no data, so callers can distinguish "0%" from
// "no attendance recorded yet" instead of conflating them.
function attendanceRate(rows) {
  const counts = { present: 0, absent: 0 };
  for (const r of rows) {
    if (r._id in counts) counts[r._id] = r.count;
  }
  const denom = counts.present + counts.absent;
  return denom > 0 ? Math.round((counts.present / denom) * 1000) / 10 : null;
}

function formatRelativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// "Total Students" = the enrolled roster (excludes pending/rejected
// applicants), same convention as buildCampusPerformance below — the two
// numbers appear on the same dashboard screen and must agree. See
// studentAttendanceController.getAttendanceReports for the same $nin.
async function buildKpis() {
  const since30d = daysAgo(30);

  const [
    totalStudents,
    newStudents30d,
    activeCampuses,
    newCampuses30d,
    totalApplications,
    hiredTotal,
    hired30d,
    pendingEmployers,
    pendingDonations,
  ] = await Promise.all([
    Student.countDocuments({ status: { $nin: ['pending', 'rejected'] } }),
    // Scoped to the same roster definition as totalStudents above — this is
    // its delta, so a newly-created pending applicant (not part of the
    // total) can't inflate "+X new" without the total itself moving.
    Student.countDocuments({ status: { $nin: ['pending', 'rejected'] }, createdAt: { $gte: since30d } }),
    Campus.countDocuments({ status: 'active' }),
    Campus.countDocuments({ status: 'active', createdAt: { $gte: since30d } }),
    JobApplication.countDocuments(),
    JobApplication.countDocuments({ status: 'hired' }),
    JobApplication.countDocuments({ status: 'hired', hiredAt: { $gte: since30d } }),
    Employer.countDocuments({ status: 'pending' }),
    Donation.countDocuments({ status: 'pending' }),
  ]);

  // Real hires (Job Applications marked 'hired') as a share of everyone who
  // ever applied — the schema has no link between a JobApplication and an
  // existing Student, so "rate" is measured against applicants, not the
  // student body.
  const placementRate = totalApplications > 0 ? Math.round((hiredTotal / totalApplications) * 1000) / 10 : null;
  const pendingApprovalsCount = pendingEmployers + pendingDonations;

  const kpis = [
    {
      id: 'total-students',
      label: 'Total Students',
      value: totalStudents.toLocaleString(),
      delta: newStudents30d > 0 ? `+${newStudents30d} new (30d)` : 'No new students (30d)',
      deltaTone: newStudents30d > 0 ? 'positive' : 'neutral',
      icon: 'students',
    },
    {
      id: 'active-campuses',
      label: 'Active Campuses',
      value: activeCampuses.toLocaleString(),
      delta: newCampuses30d > 0 ? `+${newCampuses30d} new (30d)` : 'No change (30d)',
      deltaTone: newCampuses30d > 0 ? 'positive' : 'neutral',
      icon: 'campuses',
    },
    {
      id: 'placement-rate',
      label: 'Placement Rate',
      value: placementRate === null ? 'No data' : `${placementRate}%`,
      delta: hired30d > 0 ? `+${hired30d} hired (30d)` : 'No hires (30d)',
      deltaTone: hired30d > 0 ? 'positive' : 'neutral',
      icon: 'placement',
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      value: pendingApprovalsCount.toLocaleString(),
      delta: pendingApprovalsCount > 0 ? 'Needs review' : 'All caught up',
      deltaTone: pendingApprovalsCount > 0 ? 'warning' : 'positive',
      icon: 'pending',
    },
  ];

  return kpis;
}

// Real month buckets for the last 6 calendar months (this one, plus the 5
// before it) — labeled by actual month name, not a placeholder Jan-Jun
// sequence. Placement is bucketed by JobApplication.hiredAt (when a
// candidate was actually marked 'hired'), not createdAt/updatedAt.
async function buildTrend() {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [enrollmentRows, placementRows] = await Promise.all([
    Student.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    JobApplication.aggregate([
      { $match: { status: 'hired', hiredAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { year: { $year: '$hiredAt' }, month: { $month: '$hiredAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  const enrollmentByKey = new Map(enrollmentRows.map((r) => [`${r._id.year}-${r._id.month}`, r.count]));
  const placementByKey = new Map(placementRows.map((r) => [`${r._id.year}-${r._id.month}`, r.count]));

  const trend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    trend.push({
      label: MONTH_LABELS[d.getMonth()],
      enrollment: enrollmentByKey.get(key) || 0,
      placement: placementByKey.get(key) || 0,
    });
  }
  return trend;
}

// Per-campus headcount (enrolled roster — excludes pending/rejected
// applicants, same convention as studentAttendanceController.getAttendanceReports)
// and 30-day attendance rate as the "performance" bar. StudentAttendance.campus
// is a cached name String, not a ref (see model), so it's matched by resolved
// campus name rather than _id, same as getAttendanceSummary.
async function buildCampusPerformance() {
  const campuses = await Campus.find({}, 'name').sort({ name: 1 }).lean();
  if (campuses.length === 0) return [];

  const since30d = daysAgo(30);
  const results = await Promise.all(
    campuses.map(async (c) => {
      const [students, attRows] = await Promise.all([
        Student.countDocuments({ campus: c._id, status: { $nin: ['pending', 'rejected'] } }),
        StudentAttendance.aggregate([
          { $match: { campus: c.name, date: { $gte: since30d } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);
      return {
        id: String(c._id),
        name: c.name,
        students,
        pct: attendanceRate(attRows) ?? 0,
      };
    })
  );

  return results.sort((a, b) => b.students - a.students);
}

// "Pending Approvals" = things in the schema that are genuinely sitting in a
// 'pending' state awaiting a super_admin decision: employer verification
// requests and unconfirmed donations. Nothing else in the schema has a
// pending-review concept (sub-admins are created directly, no approval step).
async function buildPendingApprovals() {
  const [employers, donations] = await Promise.all([
    Employer.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).lean(),
    Donation.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const items = [
    ...employers.map((e) => ({
      id: String(e._id),
      resource: 'employer',
      type: 'Employer',
      name: e.companyName,
      detail: `Verification request${e.city ? ` — ${e.city}` : ''}`,
      createdAt: e.createdAt,
    })),
    ...donations.map((d) => ({
      id: String(d._id),
      resource: 'donation',
      type: 'Donation',
      name: d.donorName,
      detail: `Rs. ${d.amount.toLocaleString()} — ${d.campaignTitle}`,
      createdAt: d.createdAt,
    })),
  ];

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items.slice(0, 5);
}

async function buildRecentActivity() {
  const entries = await AuditLog.find().sort({ createdAt: -1 }).limit(6).lean();
  return entries.map((e) => ({
    id: String(e._id),
    text: `${e.actorName} — ${e.summary}`,
    time: formatRelativeTime(e.createdAt),
  }));
}

exports.getDashboard = async (_req, res) => {
  try {
    const [kpis, trend, campusPerformance, pendingApprovals, recentActivity] = await Promise.all([
      buildKpis(),
      buildTrend(),
      buildCampusPerformance(),
      buildPendingApprovals(),
      buildRecentActivity(),
    ]);

    return res.status(200).json({ kpis, trend, campusPerformance, pendingApprovals, recentActivity });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};
