import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { inputClass, labelClass } from './formFieldStyles';
import { getMyAttendance } from '../../services/trainerDashboardService';
import { fetchAttendanceRequests, createAttendanceRequest } from '../../services/attendanceRequestService';
import AttendanceCorrectionModal from '../../components/AttendanceCorrectionModal';

// No dedicated design exists for this page — built from the same card
// shell/typography/form patterns as the super-admin's Profile.jsx (info
// card) and Settings.jsx (editable name/email + password form).
//
// Phone, employee ID, course, and city aren't on the User auth model
// (see server/models/User.js) — they only exist on the standalone
// Trainer CRUD record (server/models/Trainer.js), which isn't linked to
// a logged-in trainer session yet. So those four are read-only
// placeholders here, while name/email/password go through the real
// useAuth().updateProfile() the rest of the app already uses.
const TRAINER_DETAILS = {
  phone: '+92 300 1234567',
  employeeId: 'TRN-1042',
  course: 'Web Development',
  city: 'Karachi',
};

function initials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const REQUEST_STATUS_STYLE = {
  pending: { label: 'Pending', className: 'bg-warning-bg text-warning-text' },
  approved: { label: 'Approved', className: 'bg-success-bg text-success-text' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-600' },
};

function fmtDateTime(d) {
  return d ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

// Self-service: a trainer's own check-in/out history (from the Super
// Admin-operated kiosk, see trainerDashboardController.getMyAttendance),
// with a Request Correction action per row so a wrong check-in/out doesn't
// require asking an admin to raise it on their behalf — Super Admin or
// Sub-Admin then resolves it from the Attendance Request page, whichever
// gets there first (see attendanceRequestController.resolveRequest).
function MyAttendanceSection() {
  const queryClient = useQueryClient();
  const [correctionRecord, setCorrectionRecord] = useState(null);

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['trainer-my-attendance'],
    queryFn: getMyAttendance,
  });

  const { data: requestsData } = useQuery({
    queryKey: ['attendance-requests', { status: 'all', page: 1 }],
    queryFn: () => fetchAttendanceRequests({ status: 'all', page: 1, limit: 20 }),
  });
  const requests = requestsData?.items ?? [];
  const requestByAttendanceId = new Map(requests.map((r) => [String(r.trainerAttendance), r]));

  const createMutation = useMutation({
    mutationFn: createAttendanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] });
      setCorrectionRecord(null);
    },
  });

  return (
    <div className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
      <div>
        <div className="font-heading font-bold text-h6 text-neutral-900">My Attendance</div>
        <div className="text-body-sm text-neutral-400 mt-0.5">Your own check-in/check-out history. Spot a mistake? Request a correction.</div>
      </div>

      {attendanceLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !attendance?.length ? (
        <div className="py-10 text-center text-neutral-400 text-body-sm">No check-in/check-out records yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {attendance.map((row) => {
            const existingRequest = requestByAttendanceId.get(String(row._id));
            return (
              <div
                key={row._id}
                className="flex items-center justify-between gap-3 flex-wrap border border-neutral-100 rounded px-3.5 py-2.5"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-body-sm font-semibold text-neutral-900">
                    {new Date(row.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-caption text-neutral-500 font-normal">
                    In: {fmtDateTime(row.checkIn)} · Out: {fmtDateTime(row.checkOut)}
                  </span>
                </div>

                {existingRequest ? (
                  <span
                    className={`text-badge px-2.5 py-1 rounded-pill shrink-0 ${
                      (REQUEST_STATUS_STYLE[existingRequest.status] ?? REQUEST_STATUS_STYLE.pending).className
                    }`}
                  >
                    Correction {(REQUEST_STATUS_STYLE[existingRequest.status] ?? REQUEST_STATUS_STYLE.pending).label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCorrectionRecord(row)}
                    className="border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[7px] rounded cursor-pointer transition-colors hover:bg-neutral-100 shrink-0"
                  >
                    Request Correction
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {correctionRecord && (
          <AttendanceCorrectionModal
            open={!!correctionRecord}
            record={{ _id: correctionRecord._id, trainerName: correctionRecord.trainerName, campus: correctionRecord.campus }}
            onClose={() => setCorrectionRecord(null)}
            onSubmit={(payload) => createMutation.mutate(payload)}
            submitting={createMutation.isPending}
            error={createMutation.error?.response?.data?.message}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await updateProfile(payload);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start"
    >
      <motion.div variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="font-heading font-bold text-h6 text-neutral-900">Profile Information</div>
          <button
            type="button"
            onClick={handleLogout}
            className="border-none bg-[var(--trainer-blue)] text-white text-caption font-semibold px-3.5 py-2 rounded cursor-pointer transition-colors hover:brightness-90 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Logout
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-full bg-navy-800 text-gold-400 border border-gold-500/40 flex items-center justify-center font-heading font-bold text-h5 shrink-0">
            {initials(user?.name)}
          </div>
          <div>
            <div className="font-heading font-bold text-h6 text-neutral-900">{user?.name}</div>
            <div className="text-body-sm text-neutral-400">{user?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Phone</span>
            <span className="text-body-sm text-neutral-900">{TRAINER_DETAILS.phone}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Employee ID</span>
            <span className="text-body-sm text-neutral-900">{TRAINER_DETAILS.employeeId}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">Course</span>
            <span className="text-body-sm text-neutral-900">{TRAINER_DETAILS.course}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-overline uppercase text-neutral-500">City</span>
            <span className="text-body-sm text-neutral-900">{TRAINER_DETAILS.city}</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="bg-surface border border-neutral-200 rounded-xl p-[22px] flex flex-col gap-4">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">Account Settings</div>
          <div className="text-body-sm text-neutral-400 mt-0.5">Update your name, email, or password.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-name">
              Full name
            </label>
            <input id="profile-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-email">
              Email
            </label>
            <input id="profile-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="h-px bg-neutral-100 my-1" />

          <div className="text-caption font-semibold text-neutral-600">Change password (optional)</div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-current-password">
              Current password
            </label>
            <input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required only if setting a new password"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="profile-new-password">
              New password
            </label>
            <input
              id="profile-new-password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {message && (
            <div
              className={`text-caption rounded px-3 py-2 border ${
                message.type === 'success'
                  ? 'text-success-text bg-success-bg border-success-bg'
                  : 'text-danger-600 bg-danger-50 border-danger-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 self-start border-none bg-[var(--trainer-blue)] text-white text-body-sm font-semibold px-6 py-[11px] rounded cursor-pointer transition-colors hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      <motion.div variants={fadeIn} className="lg:col-span-2">
        <MyAttendanceSection />
      </motion.div>
    </motion.div>
  );
}
