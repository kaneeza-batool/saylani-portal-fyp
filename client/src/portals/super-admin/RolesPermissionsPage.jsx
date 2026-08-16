import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSubAdminsWithPermissions, updateSubAdminPermissions, grantSubAdminFullAccess } from '../../services/rolePermissionsService';

const MODULE_LABEL = {
  STUDENT: 'Students',
  ATTENDANCE_VIEW: 'View Attendance',
  ATTENDANCE_MARK: 'Mark Attendance',
  ATTENDANCE_ADD_MULTI: 'Bulk Mark Attendance',
  TRAINER: 'Trainers',
  TRAINER_ATTENDANCE_MARK: 'Mark Trainer Attendance',
  TRAINER_ATTENDANCE_VIEW: 'View Trainer Attendance',
  BATCH: 'Batches',
  ADMISSIONS: 'Admissions Queue',
  FEEDBACK: 'Feedback',
  ALERTS: 'Alerts',
  AUDIT: 'Audit Log',
  FEES: 'Fees',
};

const ACTION_LABEL = { read: 'View', write: 'Add', update: 'Edit' };

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeInUp = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

// Trainer and Student access is fixed by role at the route level
// (restrictTo in server/routes/*, never a per-user permissions document the
// way sub_admin has) — so there is nothing to edit for either role, only to
// show. Kept as a plain reference list rather than fake toggles that would
// silently do nothing if clicked, which would be worse than not having them.
const TRAINER_CAPABILITIES = [
  'Dashboard — their own batches, students, and pending-review count',
  'My Batches — every batch they are assigned to as trainer',
  'Attendance — mark present/absent/leave for students in their own course, and request corrections on their own check-in/out history',
  'Quizzes & Assignments — build quizzes and assignments for their own course, review submissions to their own assignments only',
  'Students — roster and stats for students in their own course',
  'Profile — their own account details and password',
];

const STUDENT_CAPABILITIES = [
  'Dashboard, Progress, Attendance, Payment — their own records only',
  'Assignment, Quiz — submit/attempt for their own enrolled course',
  'Resources, Ask a Doubt, Skill Passport, Certificate — self-service, own account',
  'Feedback — submit bug/idea/other feedback, request attendance corrections',
  'Profile — their own account details, avatar, and ID card',
];

function CapabilityList({ role, items }) {
  return (
    <motion.div variants={fadeInUp} className="bg-surface border border-neutral-200 rounded-xl p-5 flex flex-col gap-3">
      <div>
        <div className="font-heading font-bold text-h6 text-neutral-900">{role}</div>
        <div className="text-body-sm text-neutral-400 mt-0.5">
          Fixed by role, not per-user — every {role.toLowerCase()} account has exactly this access, nothing more or less.
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-body-sm text-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0 mt-2" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function PermissionMatrix({ subAdmin, shape, onSaved }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(subAdmin.permissions);

  useEffect(() => setDraft(subAdmin.permissions), [subAdmin]);

  const saveMutation = useMutation({
    mutationFn: (permissions) => updateSubAdminPermissions(subAdmin._id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', 'sub-admins'] });
      onSaved?.();
    },
  });

  const fullAccessMutation = useMutation({
    mutationFn: () => grantSubAdminFullAccess(subAdmin._id),
    onSuccess: (item) => {
      setDraft(item.permissions);
      queryClient.invalidateQueries({ queryKey: ['role-permissions', 'sub-admins'] });
    },
  });

  function toggle(moduleKey, action) {
    setDraft((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: !prev[moduleKey]?.[action] },
    }));
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(subAdmin.permissions);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-heading font-bold text-h6 text-neutral-900">{subAdmin.name}</div>
          <div className="text-body-sm text-neutral-400">
            {subAdmin.email} · {subAdmin.campus_id?.name || 'No campus'}
          </div>
        </div>
        <button
          type="button"
          disabled={fullAccessMutation.isPending}
          onClick={() => fullAccessMutation.mutate()}
          className="border border-gold-500 bg-surface text-gold-600 text-caption font-semibold px-3.5 py-[8px] rounded cursor-pointer transition-colors hover:bg-gold-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fullAccessMutation.isPending ? 'Granting...' : 'Grant Full Access'}
        </button>
      </div>

      <div className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        {Object.entries(shape).map(([moduleKey, actions], i) => (
          <div
            key={moduleKey}
            className={`flex items-center justify-between gap-3 flex-wrap px-4 py-3 ${i > 0 ? 'border-t border-neutral-100' : ''}`}
          >
            <span className="text-body-sm font-semibold text-neutral-900">{MODULE_LABEL[moduleKey] || moduleKey}</span>
            <div className="flex items-center gap-4">
              {actions.map((action) => (
                <label key={action} className="flex items-center gap-1.5 text-caption text-neutral-600 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[moduleKey]?.[action])}
                    onChange={() => toggle(moduleKey, action)}
                    className="cursor-pointer"
                  />
                  {ACTION_LABEL[action] || action}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate(draft)}
          className="border-none bg-gold-500 text-white text-body-sm font-semibold px-5 py-[10px] rounded cursor-pointer transition-colors hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saveMutation.isPending ? 'Saving...' : saveMutation.isSuccess && !dirty ? 'Saved ✓' : 'Save Changes'}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={() => setDraft(subAdmin.permissions)}
            className="border border-neutral-200 bg-surface text-neutral-600 text-body-sm font-semibold px-4 py-[10px] rounded cursor-pointer transition-colors hover:bg-neutral-100"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}

function SubAdminsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['role-permissions', 'sub-admins'],
    queryFn: fetchSubAdminsWithPermissions,
  });
  const [selectedId, setSelectedId] = useState(null);

  const items = data?.items ?? [];
  const shape = data?.shape ?? {};
  const selected = useMemo(() => items.find((s) => s._id === selectedId) || items[0] || null, [items, selectedId]);

  if (isLoading) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl p-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-danger-600 text-body-sm">
        Couldn't load sub-admins. Please try again.
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-surface border border-neutral-200 rounded-xl py-14 px-5 text-center text-neutral-400 text-body-sm">
        No sub-admins yet — add one from Sub-Admins first.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
      <div className="bg-surface border border-neutral-200 rounded-xl overflow-hidden">
        {items.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => setSelectedId(s._id)}
            className={`w-full text-left px-4 py-3 border-b border-neutral-100 last:border-b-0 transition-colors ${
              selected?._id === s._id ? 'bg-gold-50' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="text-body-sm font-semibold text-neutral-900 truncate">{s.name}</div>
            <div className="text-caption text-neutral-400 truncate">{s.campus_id?.name || 'No campus'}</div>
          </button>
        ))}
      </div>

      {selected && <PermissionMatrix subAdmin={selected} shape={shape} />}
    </div>
  );
}

export default function RolesPermissionsPage() {
  const [tab, setTab] = useState('sub_admin');

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
      <div className="flex border border-neutral-200 rounded overflow-hidden w-fit">
        {[
          { key: 'sub_admin', label: 'Sub-Admins' },
          { key: 'trainer', label: 'Trainers' },
          { key: 'student', label: 'Students' },
        ].map((t, i) => (
          <button
            key={t.key}
            type="button"
            data-tab={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'px-4 py-[9px] text-body-sm font-semibold cursor-pointer transition-colors',
              i > 0 ? 'border-l border-neutral-200' : '',
              tab === t.key ? 'bg-gold-500 text-white' : 'bg-surface text-neutral-600 hover:bg-neutral-100',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sub_admin' && <SubAdminsTab />}
      {tab === 'trainer' && <CapabilityList role="Trainer" items={TRAINER_CAPABILITIES} />}
      {tab === 'student' && <CapabilityList role="Student" items={STUDENT_CAPABILITIES} />}
    </motion.div>
  );
}
