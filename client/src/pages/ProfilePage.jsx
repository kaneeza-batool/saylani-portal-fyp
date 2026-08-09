import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from '../services/studentService';
import { getEnrolledCourses } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../components/Sidebar';
import Toast from '../components/Toast';
import { CameraIcon, EditIcon, LogOutIcon } from '../components/icons';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5';

const EDITABLE_FIELDS = ['phone', 'email', 'address', 'gender', 'dateOfBirth', 'lastQualification'];
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toDateInputValue(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6">
      <h3 className="font-heading text-base font-bold text-neutral-900 mb-4">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function ViewField({ label, value }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="text-sm text-neutral-800">{value || '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, refreshStudent } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { data: student, isLoading, isError, refetch } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: getProfile,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getEnrolledCourses,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
  });

  function startEditing() {
    setForm({
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      gender: student.gender || '',
      dateOfBirth: toDateInputValue(student.dateOfBirth),
      lastQualification: student.lastQualification || '',
    });
    setAvatarPreview(null);
    setPendingAvatarBase64(null);
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setForm(null);
    setAvatarPreview(null);
    setPendingAvatarBase64(null);
    setError('');
  }

  function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Unsupported image format. Use PNG, JPEG, or WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image too large (max 4MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setPendingAvatarBase64(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setError('');
    try {
      const fields = {};
      for (const key of EDITABLE_FIELDS) {
        fields[key] = form[key] || (key === 'dateOfBirth' ? null : '');
      }
      await updateMutation.mutateAsync(fields);
      if (pendingAvatarBase64) {
        await avatarMutation.mutateAsync(pendingAvatarBase64);
      }

      await queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      await refreshStudent();

      setIsEditing(false);
      setForm(null);
      setAvatarPreview(null);
      setPendingAvatarBase64(null);
      setToast({ icon: '✅', title: 'Profile updated', message: 'Your changes have been saved.' });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes. Please try again.');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
        <div className="rounded-lg overflow-hidden bg-white border border-neutral-200 shadow-card">
          <div className="h-28 sm:h-36 bg-neutral-200" />
          <div className="px-5 sm:px-8 pb-6 -mt-10 flex flex-col items-start gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-300 border-4 border-white" />
            <div className="h-5 w-40 bg-neutral-200 rounded" />
            <div className="h-4 w-24 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="h-40 bg-white border border-neutral-200 rounded-lg shadow-card" />
        <div className="h-40 bg-white border border-neutral-200 rounded-lg shadow-card" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-neutral-500">Couldn't load your profile.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900"
        >
          Retry
        </button>
      </div>
    );
  }

  const displayAvatar = avatarPreview || student.avatarUrl;
  const saving = updateMutation.isPending || avatarMutation.isPending;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        {/* Solid navy backdrop with a subtle gold corner glow + hairline
            diagonal pattern — deliberately not a literal color gradient
            blend, which read as muddy. This is a backdrop for the avatar/
            name below, not a focal point, so both effects stay low-opacity. */}
        <div
          className="h-28 sm:h-36 bg-primary-900"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 15%, rgba(208,163,91,0.28) 0%, rgba(208,163,91,0) 42%), repeating-linear-gradient(135deg, rgba(208,163,91,0.07) 0px, rgba(208,163,91,0.07) 1px, transparent 1px, transparent 13px)',
          }}
        />

        <div className="px-5 sm:px-8 pb-6">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12">
            <div className="relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={student.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-card"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-500 text-primary-900 font-bold text-2xl flex items-center justify-center border-4 border-white shadow-card">
                  {initialsOf(student.fullName)}
                </div>
              )}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change avatar"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-800 text-white flex items-center justify-center border-2 border-white hover:bg-primary-900 transition-colors"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarPick}
                    className="hidden"
                    data-testid="avatar-file-input"
                  />
                </>
              )}
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold bg-primary-800 text-white hover:bg-primary-900 transition-colors"
              >
                <EditIcon className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-md px-4 py-2 text-sm font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md px-4 py-2 text-sm font-semibold bg-accent-500 text-primary-900 hover:bg-accent-400 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-neutral-900">{student.fullName}</h1>
            <span className="inline-flex items-center mt-1.5 rounded-pill px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-800">
              Student
            </span>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-danger-bg text-danger-text text-sm font-medium px-3.5 py-2.5">
              {error}
            </div>
          )}
        </div>
      </div>

      <InfoCard title="Contact Info">
        {!isEditing ? (
          <>
            <ViewField label="Email" value={student.email} />
            <ViewField label="Phone" value={student.phone} />
            <ViewField label="Address" value={student.address} />
          </>
        ) : (
          <>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className={inputClass}
              />
            </div>
          </>
        )}
      </InfoCard>

      <InfoCard title="Personal Information">
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ViewField label="Gender" value={capitalize(student.gender)} />
            <ViewField label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <ViewField label="Last Qualification" value={student.lastQualification} />
            <ViewField label="CNIC" value={student.cnic} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Qualification</label>
              <input
                type="text"
                value={form.lastQualification}
                onChange={(e) => setForm((f) => ({ ...f, lastQualification: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CNIC</label>
              <input
                type="text"
                value={student.cnic}
                disabled
                title="CNIC is your login ID and can't be changed here. Contact your campus for corrections."
                className={`${inputClass} bg-neutral-100 text-neutral-500 cursor-not-allowed`}
              />
            </div>
          </div>
        )}
      </InfoCard>

      <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-heading text-base font-bold text-neutral-900">Enrolled Courses</h3>
          <span className="inline-flex items-center justify-center rounded-pill w-5 h-5 text-[11px] font-bold bg-neutral-100 text-neutral-500">
            {courses?.length || 0}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {courses?.length > 0 ? (
            courses.map((course) => (
              <button
                key={course._id}
                type="button"
                onClick={() => navigate(`/dashboard/${course._id}`)}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="min-w-0">
                  <span className="text-sm font-medium text-neutral-800 block truncate">{course.name}</span>
                  {course.rollNumber && (
                    <span className="text-xs text-neutral-400 block mt-0.5">Roll: {course.rollNumber}</span>
                  )}
                </span>
                <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-success-bg text-success-text shrink-0">
                  Enrolled
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-neutral-500">No courses enrolled yet.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold border border-danger-text/30 text-danger-text hover:bg-danger-bg transition-colors sm:self-start"
      >
        <LogOutIcon className="w-4 h-4" />
        Log out
      </button>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
