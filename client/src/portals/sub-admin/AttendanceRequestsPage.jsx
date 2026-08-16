import AttendanceRequestsPanel from '../../components/AttendanceRequestsPanel';

// Same panel Super Admin uses at /admin/trainers/attendance/request — list
// and resolve are both campus-scoped server-side for a sub_admin caller, so
// this page just needs to render it, no extra plumbing.
export default function AttendanceRequestsPage() {
  return <AttendanceRequestsPanel />;
}
