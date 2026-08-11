// Idempotent demo-data seed: 20 trainers, 10 batches (Slots), 60 students,
// and ~45 days of StudentAttendance for enrolled students, spread across
// the two campuses created by seedCampusAndSubAdmin.js.
//
// Safe to re-run: every insert is preceded by an existence check on a
// deterministic key (employeeId for Trainer, {campus,schedule} for Slot,
// cnic for Student, {student,date} for StudentAttendance) and skipped if
// found. Nothing is ever updated or deleted.
//
// Known schema gaps this script works around rather than papering over:
//   - Slot.trainer is a free-text String, not a ref — "assigned to a real
//     trainer" means the trainer's name string, not an id.
//   - Student has no batch/slot field at all, so "assigned to a real batch"
//     isn't representable — this script instead gives each student the same
//     `course` as one specific batch in their campus, which is the closest
//     available link. Flagging this; not adding a field a demo seed has no
//     business inventing.
require('dotenv').config();
const mongoose = require('mongoose');
const Campus = require('../models/Campus');
const Trainer = require('../models/Trainer');
const Slot = require('../models/Slot');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');

const COURSES = Student.COURSES;

function startOfDay(d) {
  return new Date(new Date(d).toDateString());
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

// Deterministic name generation — literal pools, index-rotated, offset per
// entity type so the mod-15/mod-20 cycle doesn't line up and hand identical
// names to a trainer and a student.
const MALE_FIRST = [
  'Ahmed', 'Bilal', 'Usman', 'Hamza', 'Ali', 'Fahad', 'Zeeshan', 'Tariq', 'Waqas', 'Imran',
  'Kashif', 'Naveed', 'Asad', 'Junaid', 'Faisal',
];
const FEMALE_FIRST = [
  'Ayesha', 'Fatima', 'Sana', 'Mehwish', 'Sadia', 'Rabia', 'Hina', 'Amna', 'Zainab', 'Maria',
  'Nadia', 'Sara', 'Kiran', 'Iqra', 'Bushra',
];
const SURNAMES = [
  'Raza', 'Hussain', 'Khan', 'Noor', 'Ahmed', 'Malik', 'Sheikh', 'Qureshi', 'Baig', 'Chaudhry',
  'Farooq', 'Iqbal', 'Shah', 'Rasheed', 'Abbasi', 'Siddiqui', 'Rehman', 'Yousuf', 'Warraich', 'Butt',
];

function personName(offset, index) {
  const isMale = index % 2 === 0;
  const first = (isMale ? MALE_FIRST : FEMALE_FIRST)[(offset + index) % 15];
  const last = SURNAMES[(offset + index * 3) % 20];
  return { first, last, full: `${first} ${last}` };
}

function fatherName(studentSurname, index) {
  const first = MALE_FIRST[(index * 7 + 3) % 15];
  return `${first} ${studentSurname}`;
}

function cnic(regionPrefix, index) {
  const seq = String(1000000 + index).padStart(7, '0');
  return `${regionPrefix}-${seq}-${index % 10}`;
}

function phone(index) {
  const prefix = ['0300', '0301', '0321', '0333', '0345'][index % 5];
  const rest = String(1000000 + index * 7).slice(-7);
  return `${prefix}-${rest}`;
}

// ---------------------------------------------------------------------------
// Trainers — 20 total (12 Sukkur, 8 Karachi). The first 2 of each campus
// reuse the employeeIds already created by earlier manual testing
// (TRN-SUK-001/002, TRN-KHI-001/002) so this script recognizes and skips
// them instead of erroring on the unique employeeId index.
// ---------------------------------------------------------------------------
async function seedTrainers(campusByCity) {
  const roster = [];
  for (let i = 1; i <= 12; i++) {
    const { full } = i <= 2 ? { full: i === 1 ? 'Ahmed Raza' : 'Bilal Hussain' } : personName(0, i);
    roster.push({
      employeeId: `TRN-SUK-${String(i).padStart(3, '0')}`,
      name: full,
      course: COURSES[i % COURSES.length],
      city: 'Sukkur',
      campus: campusByCity.Sukkur,
    });
  }
  for (let i = 1; i <= 8; i++) {
    const { full } = i <= 2 ? { full: i === 1 ? 'Ayesha Khan' : 'Fatima Noor' } : personName(50, i);
    roster.push({
      employeeId: `TRN-KHI-${String(i).padStart(3, '0')}`,
      name: full,
      course: COURSES[(i + 3) % COURSES.length],
      city: 'Karachi',
      campus: campusByCity.Karachi,
    });
  }

  let inserted = 0;
  for (const t of roster) {
    const exists = await Trainer.findOne({ employeeId: t.employeeId });
    if (exists) continue;
    await Trainer.create({
      name: t.name,
      email: `${t.name.toLowerCase().replace(/\s+/g, '.')}@titan-demo.com`,
      phone: phone(inserted + 200),
      employeeId: t.employeeId,
      course: t.course,
      city: t.city,
      campus: t.campus,
      status: inserted % 9 === 0 ? 'inactive' : 'active',
    });
    inserted++;
  }
  return { inserted, roster };
}

// ---------------------------------------------------------------------------
// Batches (Slots) — 10 total (6 Sukkur, 4 Karachi). Idempotency key is
// {campus, schedule}; schedule embeds a stable "BATCH-xxx-NN" code so a
// re-run finds the exact same string and skips.
// ---------------------------------------------------------------------------
const SCHEDULE_TEMPLATES = [
  'Mon/Wed 10:00 AM - 12:00 PM',
  'Tue/Thu 02:00 PM - 04:00 PM',
  'Sat 11:00 AM - 02:00 PM',
  'Mon/Wed/Fri 09:00 AM - 10:30 AM',
  'Sat/Sun 03:00 PM - 05:00 PM',
];
const SLOT_STATUSES = ['active', 'active', 'active', 'inactive'];

async function seedSlots(campusByCity, trainersByCity) {
  const plan = [];
  for (let i = 1; i <= 6; i++) {
    plan.push({
      code: `BATCH-SUK-${String(i).padStart(2, '0')}`,
      city: 'Sukkur',
      campus: campusByCity.Sukkur,
      course: COURSES[i % COURSES.length],
      trainer: trainersByCity.Sukkur[i % trainersByCity.Sukkur.length],
    });
  }
  for (let i = 1; i <= 4; i++) {
    plan.push({
      code: `BATCH-KHI-${String(i).padStart(2, '0')}`,
      city: 'Karachi',
      campus: campusByCity.Karachi,
      course: COURSES[(i + 2) % COURSES.length],
      trainer: trainersByCity.Karachi[i % trainersByCity.Karachi.length],
    });
  }

  let inserted = 0;
  const created = [];
  for (const [i, b] of plan.entries()) {
    const schedule = `${b.code} · ${b.course} · ${SCHEDULE_TEMPLATES[i % SCHEDULE_TEMPLATES.length]}`;
    const existing = await Slot.findOne({ campus: b.campus, schedule });
    if (existing) {
      created.push(existing);
      continue;
    }
    const seatsTotal = 20 + (i % 4) * 5;
    const doc = await Slot.create({
      schedule,
      trainer: b.trainer,
      course: b.course,
      campus: b.campus,
      seatsTotal,
      seatsFilled: Math.min(seatsTotal, 8 + (i % 5) * 3),
      gender: 'Mixed',
      status: SLOT_STATUSES[i % SLOT_STATUSES.length],
    });
    created.push(doc);
    inserted++;
  }
  return { inserted, slots: created };
}

// ---------------------------------------------------------------------------
// Students — 60 total (35 Sukkur, 25 Karachi). Status mix per campus:
// pending 5+3, dropout 2+2, completed 5+3, enrolled 23+17 (= 40 enrolled,
// the pool attendance gets generated for). CNIC is the idempotency key.
// ---------------------------------------------------------------------------
function buildStudentPlan(city, campusId, regionPrefix, offset, slotsForCampus) {
  const counts = city === 'Sukkur' ? { pending: 5, dropout: 2, completed: 5, enrolled: 23 } : { pending: 3, dropout: 2, completed: 3, enrolled: 17 };
  const statuses = [
    ...Array(counts.pending).fill('pending'),
    ...Array(counts.dropout).fill('dropout'),
    ...Array(counts.completed).fill('completed'),
    ...Array(counts.enrolled).fill('enrolled'),
  ];

  const plan = [];
  for (let i = 0; i < statuses.length; i++) {
    const { first, last, full } = personName(offset, i);
    const batch = slotsForCampus[i % slotsForCampus.length];
    plan.push({
      name: full,
      father: fatherName(last, offset + i),
      cnic: cnic(regionPrefix, offset + i),
      phone: phone(offset + i),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${offset + i}@titan-demo.com`,
      course: batch.course,
      campus: campusId,
      status: statuses[i],
      payment: ['paid', 'pending', 'paid', 'overdue'][i % 4],
      address: `${city} Sector ${(i % 12) + 1}, ${city}, Pakistan`,
    });
  }
  return plan;
}

async function seedStudents(campusByCity, slotsByCity) {
  const plan = [
    ...buildStudentPlan('Sukkur', campusByCity.Sukkur, '45401', 1000, slotsByCity.Sukkur),
    ...buildStudentPlan('Karachi', campusByCity.Karachi, '42401', 2000, slotsByCity.Karachi),
  ];

  let inserted = 0;
  const enrolled = { Sukkur: [], Karachi: [] };
  for (const s of plan) {
    let doc = await Student.findOne({ cnic: s.cnic });
    if (!doc) {
      doc = await Student.create(s);
      inserted++;
    }
    if (doc.status === 'enrolled') {
      const city = String(doc.campus) === String(campusByCity.Sukkur) ? 'Sukkur' : 'Karachi';
      enrolled[city].push(doc);
    }
  }
  return { inserted, enrolled };
}

// ---------------------------------------------------------------------------
// Attendance — last 45 days for every enrolled student, campus stored as
// the cached campus-name string (StudentAttendance.campus is not a ref —
// see model comment). Cohorts, in generation order within each campus's
// enrolled list:
//   [0,1] (Sukkur) / [0] (Karachi)   -> 3+ consecutive absences
//   [2]   (Sukkur) / [1] (Karachi)   -> < 60% over the last 30 days
//   [3]   (Sukkur) / [2] (Karachi)   -> sharp drop: last 15d vs prior 15d
//   everyone else                    -> baseline 75-95%
// ---------------------------------------------------------------------------
const WINDOW_DAYS = 45;

function statusForDay(presentProb, leaveShare) {
  const r = Math.random();
  if (r < presentProb) return 'present';
  if (r < presentProb + (1 - presentProb) * leaveShare) return 'leave';
  return 'absent';
}

function buildAttendanceForStudent(student, campusName, cohort) {
  const days = [];
  // Oldest day first, index 0..44; index 44 is today.
  const consecutiveAbsenceStart = 20; // 4-day absence run at days[20..23]
  for (let idx = 0; idx < WINDOW_DAYS; idx++) {
    const date = daysAgo(WINDOW_DAYS - 1 - idx);
    let status;
    if (cohort === 'consecutive-absence' && idx >= consecutiveAbsenceStart && idx < consecutiveAbsenceStart + 4) {
      status = 'absent';
    } else if (cohort === 'below-60') {
      status = statusForDay(0.48, 0.15);
    } else if (cohort === 'sharp-drop') {
      status = idx < 30 ? statusForDay(0.92, 0.1) : statusForDay(0.3, 0.15);
    } else {
      // baseline: per-student target present rate, stable for the whole window
      status = statusForDay(student._baselineRate, 0.15);
    }
    days.push({
      student: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      course: student.course,
      campus: campusName,
      date,
      status,
    });
  }
  return days;
}

async function seedAttendance(enrolled, campusNameByCity) {
  const docs = [];
  for (const city of ['Sukkur', 'Karachi']) {
    const list = enrolled[city];
    const cohortOf = (i) => {
      if (city === 'Sukkur') {
        if (i <= 1) return 'consecutive-absence';
        if (i === 2) return 'below-60';
        if (i === 3) return 'sharp-drop';
      } else {
        if (i === 0) return 'consecutive-absence';
        if (i === 1) return 'below-60';
        if (i === 2) return 'sharp-drop';
      }
      return 'baseline';
    };
    list.forEach((student, i) => {
      student._baselineRate = 0.75 + (i % 5) * 0.04; // spreads 0.75..0.91
    });
    for (let i = 0; i < list.length; i++) {
      docs.push(...buildAttendanceForStudent(list[i], campusNameByCity[city], cohortOf(i)));
    }
  }

  // Pre-filter against what's already there so a re-run inserts nothing —
  // {student, date} is the schema's unique index.
  const studentIds = [...new Set(docs.map((d) => String(d.student)))];
  const existing = await StudentAttendance.find({ student: { $in: studentIds } }, 'student date').lean();
  const existingKeys = new Set(existing.map((e) => `${e.student}_${startOfDay(e.date).getTime()}`));

  const toInsert = docs.filter((d) => !existingKeys.has(`${d.student}_${d.date.getTime()}`));
  if (toInsert.length > 0) {
    await StudentAttendance.insertMany(toInsert, { ordered: false });
  }
  return { inserted: toInsert.length, skipped: docs.length - toInsert.length };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const campuses = await Campus.find({ city: { $in: ['Sukkur', 'Karachi'] } });
  const campusByCity = {};
  const campusNameByCity = {};
  for (const c of campuses) {
    campusByCity[c.city] = c._id;
    campusNameByCity[c.city] = c.name;
  }
  if (!campusByCity.Sukkur || !campusByCity.Karachi) {
    throw new Error('Sukkur/Karachi campuses not found — run seed:campus-subadmin first.');
  }

  const trainerResult = await seedTrainers(campusByCity);
  const allTrainers = await Trainer.find({ campus: { $in: [campusByCity.Sukkur, campusByCity.Karachi] } });
  const trainersByCity = {
    Sukkur: allTrainers.filter((t) => t.city === 'Sukkur').map((t) => t.name),
    Karachi: allTrainers.filter((t) => t.city === 'Karachi').map((t) => t.name),
  };

  const slotResult = await seedSlots(campusByCity, trainersByCity);
  const slotsByCity = {
    Sukkur: slotResult.slots.filter((s) => String(s.campus) === String(campusByCity.Sukkur)),
    Karachi: slotResult.slots.filter((s) => String(s.campus) === String(campusByCity.Karachi)),
  };

  const studentResult = await seedStudents(campusByCity, slotsByCity);
  const attendanceResult = await seedAttendance(studentResult.enrolled, campusNameByCity);

  console.log('--- Seed results ---');
  console.log(`Trainers inserted: ${trainerResult.inserted}`);
  console.log(`Slots inserted: ${slotResult.inserted}`);
  console.log(`Students inserted: ${studentResult.inserted}`);
  console.log(`StudentAttendance inserted: ${attendanceResult.inserted} (skipped as already-existing: ${attendanceResult.skipped})`);

  console.log('--- Resulting totals ---');
  console.log(`Trainer: ${await Trainer.countDocuments()}`);
  console.log(`Slot: ${await Slot.countDocuments()}`);
  console.log(`Student: ${await Student.countDocuments()}`);
  console.log(`StudentAttendance: ${await StudentAttendance.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
