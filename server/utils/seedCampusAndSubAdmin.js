require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Campus = require('../models/Campus');
const { FULL_ACCESS_PERMISSIONS } = require('./fullAccessPermissions');

const CAMPUSES = [
  { name: 'Saylani TITAN Sukkur Campus', city: 'Sukkur', country: 'Pakistan', status: 'active' },
  { name: 'Saylani TITAN Karachi Campus', city: 'Karachi', country: 'Pakistan', status: 'active' },
];

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

  const campusByName = {};
  for (const c of CAMPUSES) {
    campusByName[c.name] = await ensureCampus(c);
  }
  const sukkur = campusByName['Saylani TITAN Sukkur Campus'];

  await ensureUser({
    name: 'Sukkur Sub Admin',
    email: 'subadmin.sukkur@titan.com',
    password: 'SubAdmin123!',
    role: 'sub_admin',
    campus_id: sukkur._id,
    permissions: FULL_ACCESS_PERMISSIONS,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
