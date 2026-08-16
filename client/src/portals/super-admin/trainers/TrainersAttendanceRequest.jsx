import AttendanceRequestsPanel from '../../../components/AttendanceRequestsPanel';

// Trainer and Student attendance correction requests both land here now —
// see AttendanceRequestsPanel for the shared list/resolve UI (also reused
// as-is by Sub-Admin at /sub-admin/attendance-requests, since resolving is
// campus-scoped server-side either way).
export default function TrainersAttendanceRequest() {
  return <AttendanceRequestsPanel />;
}
