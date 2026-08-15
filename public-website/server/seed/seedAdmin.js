// One-time seed for the single hardcoded admin account used by the Admin
// Dashboard. Re-runnable: replaces any existing account at ADMIN_EMAIL and
// prints a freshly generated password each time it's run.
require('dotenv').config();
require('../utils/fixDns');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

const ADMIN_EMAIL = 'admin@titan.edu.pk';

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await AdminUser.deleteOne({ email: ADMIN_EMAIL });
  await AdminUser.create({ email: ADMIN_EMAIL, passwordHash, name: 'TITAN Admin' });

  console.log('Admin account seeded:');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Admin seed failed:', err);
  process.exit(1);
});
