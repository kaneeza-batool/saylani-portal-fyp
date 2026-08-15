require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Campus = require('../models/Campus');
const { FULL_ACCESS_PERMISSIONS } = require('./fullAccessPermissions');

const CAMPUSES = [
  { name: 'Saylani TITAN Sukkur Campus', city: 'Sukkur', country: 'Pakistan', status: 'active' },
  { name: 'Saylani TITAN Karachi Campus', city: 'Karachi', country: 'Pakistan', status: 'active' },
];

// One sub-admin per campus already in the database (covers the 3 campuses
// added later by seedExpansionCampuses.js — Lahore, Islamabad, Multan —
// without needing them hardcoded here too). Email/password follow the same
// subadmin.<city>@titan.com / SubAdmin123! convention as the two above.
async function ensureSubAdminForEveryCampus() {
  const Campus = require('./../models/Campus');
  const campuses = await Campus.find({});
  for (const c of campuses) {
    const slug = c.city.toLowerCase().replace(/[^a-z0-9]/g, '');
    await ensureUser({
      name: `${c.city} Sub Admin`,
      email: `subadmin.${slug}@titan.com`,
      password: 'SubAdmin123!',
      role: 'sub_admin',
      campus_id: c._id,
      permissions: FULL_ACCESS_PERMISSIONS,
    });
  }
}

async function ensureCampus({ name, city, country, status }) {
  const existing = await Campus.findOne({ name });
  if (existing) {
    console.log(`Campus already exists: ${name} (${existing._id})`);
    return existing;
  }
  const campus = await Campus.create({ name, city, country, status });
  console.log(`Campus created: ${name} (${campus._id})`);
  return campus;
}

async function ensureUser({ name, email, password, role, campus_id, permissions }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`${role} already exists: ${email}`);
    return existing;
  }
  const user = await User.create({ name, email, password, role, campus_id, status: 'active', permissions });
  console.log(`${role} created — email: ${email}  campus_id: ${campus_id}`);
  return user;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const c of CAMPUSES) {
    await ensureCampus(c);
  }

  await ensureSubAdminForEveryCampus();

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
