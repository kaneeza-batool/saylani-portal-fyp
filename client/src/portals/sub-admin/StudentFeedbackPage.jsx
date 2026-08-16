import StudentFeedbackPanel from '../../components/StudentFeedbackPanel';

// Same panel Super Admin uses at /admin/student-feedback — campus-scoped
// server-side for a sub_admin caller, so this page just renders it.
export default function StudentFeedbackPage() {
  return <StudentFeedbackPanel />;
}
