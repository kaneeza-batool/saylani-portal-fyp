// Seed for the single hardcoded admin account used by the Admin Dashboard.
// Idempotent like seedCampusAndSubAdmin.js's ensureUser, but resets the
// password on every run instead of skipping when the account already
// exists — the whole point is that running this always leaves you with
// known-working credentials, not "works the first time, then whatever the
// DB happened to have." Default password is a fixed constant, not printed
// to stdout — same reasoning as seedCampusAndSubAdmin.js, which dropped
// plaintext password logging for the same reason: a password that only
// ever existed in scrollback is unrecoverable the moment you lose the
// terminal. It lives in this file, in source control, not in output.
//
// SEED_ADMIN_RANDOM_PASSWORD=true opts back into a randomly generated
// password instead (e.g. for a real deployment where a hardcoded default
// isn't acceptable) — that path still has to print it once, since a random
// password with nowhere else to go is unrecoverable otherwise. Capture it
// immediately into a secrets manager; it's shown exactly once.
require('dotenv').config();
require('../utils/fixDns');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

const ADMIN_EMAIL = 'admin@titan.edu.pk';
const DEFAULT_PASSWORD = 'TitanAdmin@2026';

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

  const useRandom = process.env.SEED_ADMIN_RANDOM_PASSWORD === 'true';
  const password = useRandom ? generatePassword() : DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await AdminUser.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = existing.name || 'TITAN Admin';
    await existing.save();
    console.log(`Admin account already existed — password reset: ${ADMIN_EMAIL}`);
  } else {
    await AdminUser.create({ email: ADMIN_EMAIL, passwordHash, name: 'TITAN Admin' });
    console.log(`Admin account created: ${ADMIN_EMAIL}`);
  }

  if (useRandom) {
    console.log(`Password (shown once, not stored anywhere in plaintext): ${password}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Admin seed failed:', err);
  process.exit(1);
});
