import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '/images/logo/titan-logo-clean.png';
import { useAuth } from '../context/AuthContext';
import { LogOutIcon } from '../components/icons';

// Landing spot for a student who's finished onboarding but whose admission
// isn't approved yet (or was rejected/dropped) — student.portalAccess is
// false, so ProtectedRoute sends every other route here instead. Their own
// account/profile info still loaded fine (protectAny allowed that), so
// this can greet them by name; it just can't show any course content.
const STATUS_COPY = {
  pending: {
    title: 'Your application is under review',
    body: "You're all set up — a Super Admin just needs to approve your enrollment before the portal unlocks. This is usually quick; check back soon.",
  },
  rejected: {
    title: 'Your application was not approved',
    body: 'Please contact your campus admissions office for details or next steps.',
  },
  dropout: {
    title: "You don't currently have portal access",
    body: 'Your enrollment was marked as withdrawn. Contact your campus admissions office if you believe this is a mistake.',
  },
};
const DEFAULT_COPY = {
  title: "You don't currently have portal access",
  body: 'Please contact your campus admissions office for details.',
};

export default function PendingApprovalPage() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const copy = STATUS_COPY[student?.status] || DEFAULT_COPY;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <div className="flex flex-col items-center gap-2">
        <img src={logo} alt="TITAN" className="w-16 h-16 object-contain" />
        <h1 className="font-heading text-xl font-bold text-primary-800">Student Portal</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg shadow-card p-8 flex flex-col items-center gap-4 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-warning-bg text-warning-text flex items-center justify-center text-2xl">
          ⏳
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-neutral-900">
            {student?.fullName ? `Hi ${student.fullName.split(' ')[0]}, ` : ''}
            {copy.title}
          </h2>
          <p className="text-sm text-neutral-500 mt-1.5">{copy.body}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <LogOutIcon className="w-4 h-4" />
          Log out
        </button>
      </motion.div>
    </div>
  );
}
