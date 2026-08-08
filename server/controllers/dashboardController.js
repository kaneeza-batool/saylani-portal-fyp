// Data below mirrors the KPI/trend/campus/approvals/activity shapes from
// the TITAN Super Admin Portal.html design file exactly (same labels,
// same relative proportions), sourced here rather than aggregated from
// the DB — Student/Campus/Approval/Activity models don't exist yet in
// this codebase (only User, from the auth work). Swap the body of each
// build*() helper for a real query once those models land; the response
// shape is what the frontend contracts against, so it won't need to change.

function buildKpis() {
  return [
    {
      id: 'total-students',
      label: 'Total Students',
      value: '4,820',
      delta: '+3.2%',
      deltaTone: 'positive',
      icon: 'students',
    },
    {
      id: 'active-campuses',
      label: 'Active Campuses',
      value: '12',
      delta: '+1',
      deltaTone: 'positive',
      icon: 'campuses',
    },
    {
      id: 'placement-rate',
      label: 'Placement Rate',
      value: '68%',
      delta: '+4.1%',
      deltaTone: 'positive',
      icon: 'placement',
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      value: '5',
      delta: 'Needs review',
      deltaTone: 'warning',
      icon: 'pending',
    },
  ];
}

function buildTrend() {
  return [
    { label: 'Jan', enrollment: 70, placement: 40 },
    { label: 'Feb', enrollment: 85, placement: 48 },
    { label: 'Mar', enrollment: 95, placement: 55 },
    { label: 'Apr', enrollment: 110, placement: 62 },
    { label: 'May', enrollment: 125, placement: 74 },
    { label: 'Jun', enrollment: 140, placement: 90 },
  ];
}

function buildCampusPerformance() {
  return [
    { id: 'karachi-gulshan', name: 'Karachi Gulshan Campus', students: 1240, pct: 74 },
    { id: 'sukkur-titan', name: 'Sukkur TITAN Campus', students: 690, pct: 68 },
    { id: 'lahore-model-town', name: 'Lahore Model Town Campus', students: 980, pct: 61 },
    { id: 'islamabad-g9', name: 'Islamabad G-9 Campus', students: 560, pct: 57 },
    { id: 'multan', name: 'Multan Campus', students: 410, pct: 49 },
  ];
}

function buildPendingApprovals() {
  return [
    { id: 'ap1', type: 'Employer', name: 'Nexbyte Software House', detail: 'Verification request — Karachi' },
    { id: 'ap2', type: 'Employer', name: 'Vertex Digital Solutions', detail: 'Verification request — Lahore' },
    { id: 'ap3', type: 'Sub-Admin', name: 'Ayesha Farooq', detail: 'Requesting access — Multan Campus' },
  ];
}

function buildRecentActivity() {
  return [
    { id: 'act1', text: 'Sub-admin Ayesha approved 12 new students at Sukkur Campus', time: '2h ago' },
    { id: 'act2', text: 'Nexbyte Software House applied for employer verification', time: '4h ago' },
    { id: 'act3', text: '38 students marked present — Karachi Gulshan Campus', time: '5h ago' },
    { id: 'act4', text: 'New batch "AI & Data Science — Batch 3" created in Lahore', time: '1d ago' },
    { id: 'act5', text: 'Quiz "HTML/CSS Basics" completed by 48 students', time: '1d ago' },
  ];
}

exports.getDashboard = async (_req, res) => {
  try {
    return res.status(200).json({
      kpis: buildKpis(),
      trend: buildTrend(),
      campusPerformance: buildCampusPerformance(),
      pendingApprovals: buildPendingApprovals(),
      recentActivity: buildRecentActivity(),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};
