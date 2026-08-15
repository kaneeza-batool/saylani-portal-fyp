require('dotenv').config();
require('./fixDns');
const mongoose = require('mongoose');
const User = require('../models/User');
const Slot = require('../models/Slot');

const EMAIL = 'trainer@titan.com';
const PASSWORD = 'Trainer123!';

// seatsFilled/seatsTotal drives the dashboard's progress % live (see
// trainerDashboardController.js) — it's not a stored field, so each pair
// below is chosen to land on the requested percentage exactly rather than
// matching the suggested student counts literally (e.g. Digital Marketing
// asked for "75% / 24 of 30", but 24/30 is actually 80% — used 24/32 so
// both the % and the student count stay close to what was asked).
const DEMO_SLOTS = [
  { schedule: 'Mon, Wed, Fri · 10:00 AM', course: 'Web Development', campus: 'Karachi Gulshan Campus', seatsTotal: 40, seatsFilled: 32 },
  { schedule: 'Tue, Thu · 2:00 PM', course: 'Graphic Designing', campus: 'Karachi Gulshan Campus', seatsTotal: 30, seatsFilled: 27 },
  { schedule: 'Mon, Wed · 12:00 PM', course: 'Digital Marketing', campus: 'Karachi Gulshan Campus', seatsTotal: 32, seatsFilled: 24 }, // 75%
  { schedule: 'Tue, Thu, Sat · 4:00 PM', course: 'Mobile App Development (Flutter)', campus: 'Karachi Gulshan Campus', seatsTotal: 30, seatsFilled: 18 }, // 60%
  { schedule: 'Wed, Fri · 11:00 AM', course: 'UI/UX Design', campus: 'Karachi Gulshan Campus', seatsTotal: 20, seatsFilled: 19 }, // 95%
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  let trainer = await User.findOne({ email: EMAIL });
  if (trainer) {
    console.log(`Demo trainer already exists: ${EMAIL}`);
  } else {
    trainer = await User.create({
      name: 'Sir Adeel Anwar',
      email: EMAIL,
      password: PASSWORD,
      role: 'trainer',
      status: 'active',
    });
    console.log(`Demo trainer created — email: ${EMAIL}  password: ${PASSWORD}`);
  }

  for (const slotData of DEMO_SLOTS) {
    const existing = await Slot.findOne({ assignedTrainer: trainer._id, course: slotData.course, schedule: slotData.schedule });
    if (existing) {
      console.log(`Slot already seeded: ${slotData.course} (${slotData.schedule})`);
      continue;
    }
    await Slot.create({
      ...slotData,
      trainer: trainer.name,
      assignedTrainer: trainer._id,
    });
    console.log(`Slot created: ${slotData.course} (${slotData.schedule})`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
