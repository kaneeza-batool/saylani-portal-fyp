require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL = 'admin@titan.com';
const PASSWORD = 'Admin123!';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: EMAIL });
  if (existing) {
    console.log(`Super admin already exists: ${EMAIL}`);
  } else {
    await User.create({
      name: 'Super Admin',
      email: EMAIL,
      password: PASSWORD,
      role: 'super_admin',
      status: 'active',
    });
    console.log(`Super admin created — email: ${EMAIL}  password: ${PASSWORD}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
