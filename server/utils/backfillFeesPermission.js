// One-off migration: sub_admin accounts created before the FEES permission
// module existed have permissions.FEES === undefined, which checkPermission
// treats as denied. subAdminController.updateSubAdmin never touches
// `permissions` (see its comment) and there's no granular permission editor
// UI, so existing accounts can't pick this grant up any other way. Idempotent
// and safe to re-run: only touches accounts that don't already have it.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);

  const subAdmins = await User.find({ role: 'sub_admin', 'permissions.FEES': { $exists: false } });
  console.log(`Found ${subAdmins.length} sub_admin account(s) missing the FEES permission.`);

  for (const user of subAdmins) {
    user.permissions.FEES = { read: true, update: true };
    await user.save();
    console.log(`Granted FEES read/update to ${user.email}`);
  }

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
