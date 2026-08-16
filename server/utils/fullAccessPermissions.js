// Full-access permission grant for a sub_admin — every module/action the
// User schema defines, all true. Shared by the seed script and
// subAdminController so the two can't drift out of sync.
const FULL_ACCESS_PERMISSIONS = {
  STUDENT: { read: true, write: true, update: true },
  ATTENDANCE_VIEW: { read: true, write: true },
  ATTENDANCE_MARK: { read: true, write: true, update: true },
  ATTENDANCE_ADD_MULTI: { read: true, write: true, update: true },
  TRAINER: { read: true, write: true },
  TRAINER_ATTENDANCE_MARK: { read: true, write: true, update: true },
  TRAINER_ATTENDANCE_VIEW: { read: true, write: true },
  BATCH: { read: true, write: true, update: true },
  ADMISSIONS: { read: true, write: true, update: true },
  FEEDBACK: { read: true },
  ALERTS: { read: true },
  AUDIT: { read: true },
  FEES: { read: true, update: true },
};

module.exports = { FULL_ACCESS_PERMISSIONS };
