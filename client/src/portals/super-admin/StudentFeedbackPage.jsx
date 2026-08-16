import StudentFeedbackPanel from '../../components/StudentFeedbackPanel';

// Also reused as-is by Sub-Admin at /sub-admin/student-feedback — listing
// and responding are both campus-scoped server-side for a sub_admin caller.
export default function StudentFeedbackPage() {
  return <StudentFeedbackPanel />;
}
