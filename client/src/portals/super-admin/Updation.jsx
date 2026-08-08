import AuditLogList from '../../components/AuditLogList';

// "Updation" wasn't shown open in any of the reference screenshots — only
// the nav item and, in the Profile screenshot, an UPDATION permission
// module. Interpreted here as a feed of recent field updates across the
// system (a filtered view of the same audit trail Audit Log uses), since
// that's the closest defensible reading without a concrete spec. Flag if
// you meant something else (e.g. a pending-approval queue for
// student/trainer-submitted profile edits) and it can be rebuilt.
export default function Updation() {
  return <AuditLogList fixedAction="update" emptyText="No records have been updated yet." />;
}
