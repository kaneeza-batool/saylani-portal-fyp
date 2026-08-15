// Idempotent seed: adds 3 more campuses (Lahore, Islamabad, Multan) on top
// of the Sukkur/Karachi pair from seedCampusAndSubAdmin.js + seedDemoData.js,
// each with trainers, batches (Slots), students, and attendance — same shape
// and idempotency approach as seedDemoData.js (existence check on a
// deterministic key before every insert, safe to re-run).
//
// Purpose: the Dashboard's Campus Performance card and Enrollment Trend
// chart read live from these collections, so a 2-campus/61-student dataset
// looks visibly thinner than the TITAN Super Admin Portal.html design
// reference (5 campuses, thousands of students). This closes that gap with
// more real seeded records rather than fabricated dashboard numbers.
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

const MALE_FIRST = [
  'Shahzad', 'Adnan', 'Farrukh', 'Sajid', 'Rizwan', 'Owais', 'Danish', 'Haroon', 'Zubair', 'Aamir',
  'Nabeel', 'Shoaib', 'Umair', 'Talha', 'Ibrahim',
];
const FEMALE_FIRST = [
  'Mahnoor', 'Areeba', 'Hafsa', 'Laiba', 'Anum', 'Sidra', 'Komal', 'Rimsha', 'Aiman', 'Noor',
  'Shazia', 'Farah', 'Saba', 'Uzma', 'Wajeeha',
];
const SURNAMES = [
  'Aslam', 'Javed', 'Latif', 'Bhatti', 'Gill', 'Cheema', 'Awan', 'Mirza', 'Soomro', 'Memon',
  'Dar', 'Khokhar', 'Satti', 'Abbasi', 'Niazi', 'Ranjha', 'Gondal', 'Joyia', 'Leghari', 'Chandio',
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
  const prefix = ['0302', '0311', '0322', '0334', '0346'][index % 5];
  const rest = String(1000000 + index * 7).slice(-7);
  return `${prefix}-${rest}`;
}

const SCHEDULE_TEMPLATES = [
  'Mon/Wed 10:00 AM - 12:00 PM',
  'Tue/Thu 02:00 PM - 04:00 PM',
  'Sat 11:00 AM - 02:00 PM',
  'Mon/Wed/Fri 09:00 AM - 10:30 AM',
  'Sat/Sun 03:00 PM - 05:00 PM',
];
const SLOT_STATUSES = ['active', 'active', 'active', 'inactive'];

const CITY_PLANS = [
  {
    city: 'Lahore',
    campusName: 'Lahore Model Town Campus',
    regionPrefix: '35201',
    studentOffset: 6000,
    trainerOffset: 600,
    trainerCount: 10,
    slotCount: 5,
    counts: { pending: 4, dropout: 2, completed: 4, enrolled: 20 },
  },
  {
    city: 'Islamabad',
    campusName: 'Islamabad G-9 Campus',
    regionPrefix: '61101',
    studentOffset: 7000,
    trainerOffset: 700,
    trainerCount: 7,
    slotCount: 4,
    counts: { pending: 2, dropout: 1, completed: 3, enrolled: 14 },
  },
  {
    city: 'Multan',
    campusName: 'Multan Campus',
    regionPrefix: '36301',
    studentOffset: 8000,
    trainerOffset: 800,
    trainerCount: 6,
    slotCount: 3,
    counts: { pending: 2, dropout: 1, completed: 2, enrolled: 11 },
  },
];

async function ensureCampus(plan) {
  const existing = await Campus.findOne({ name: plan.campusName });
  if (existing) return existing;
  return Campus.create({ name: plan.campusName, city: plan.city, country: 'Pakistan', status: 'active' });
}

async function seedTrainers(plan, campusId) {
  const roster = [];
  for (let i = 1; i <= plan.trainerCount; i++) {
    const { full } = personName(plan.trainerOffset, i);
    roster.push({
      employeeId: `TRN-${plan.city.slice(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
      name: full,
      course: COURSES[i % COURSES.length],
    });
  }

  let inserted = 0;
  const names = [];
  for (const t of roster) {
    let doc = await Trainer.findOne({ employeeId: t.employeeId });
    if (!doc) {
      doc = await Trainer.create({
        name: t.name,
        email: `${t.name.toLowerCase().replace(/\s+/g, '.')}@titan-demo.com`,
        phone: phone(plan.trainerOffset + inserted),
        employeeId: t.employeeId,
        course: t.course,
        city: plan.city,
        campus: campusId,
        status: inserted % 9 === 0 ? 'inactive' : 'active',
      });
      inserted++;
    }
    names.push(doc.name);
  }
  return { inserted, names };
}

async function seedSlots(plan, campusId, trainerNames) {
  const created = [];
  let inserted = 0;
  for (let i = 1; i <= plan.slotCount; i++) {
    const course = COURSES[i % COURSES.length];
    const trainer = trainerNames[i % trainerNames.length];
    const schedule = `BATCH-${plan.city.slice(0, 3).toUpperCase()}-${String(i).padStart(2, '0')} · ${course} · ${SCHEDULE_TEMPLATES[i % SCHEDULE_TEMPLATES.length]}`;
    let doc = await Slot.findOne({ campus: campusId, schedule });
    if (!doc) {
      const seatsTotal = 20 + (i % 4) * 5;
      doc = await Slot.create({
        schedule,
        trainer,
        course,
        campus: campusId,
        seatsTotal,
        seatsFilled: Math.min(seatsTotal, 8 + (i % 5) * 3),
        gender: 'Mixed',
        status: SLOT_STATUSES[i % SLOT_STATUSES.length],
      });
      inserted++;
    }
    created.push(doc);
  }
  return { inserted, slots: created };
}

function buildStudentPlan(plan, campusId, slots) {
  const { pending, dropout, completed, enrolled } = plan.counts;
  const statuses = [
    ...Array(pending).fill('pending'),
    ...Array(dropout).fill('dropout'),
    ...Array(completed).fill('completed'),
    ...Array(enrolled).fill('enrolled'),
  ];

  return statuses.map((status, i) => {
    const { first, last, full } = personName(plan.studentOffset, i);
    const batch = slots[i % slots.length];
    return {
      name: full,
      father: fatherName(last, plan.studentOffset + i),
      cnic: cnic(plan.regionPrefix, plan.studentOffset + i),
      phone: phone(plan.studentOffset + i),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${plan.studentOffset + i}@titan-demo.com`,
      course: batch.course,
      campus: campusId,
      status,
      payment: ['paid', 'pending', 'paid', 'overdue'][i % 4],
      address: `${plan.city} Sector ${(i % 12) + 1}, ${plan.city}, Pakistan`,
    };
  });
}

// Spreads createdAt across the last 6 calendar months, weighted toward the
// present, so the Dashboard's Enrollment Trend chart shows these campuses'
// growth alongside Sukkur/Karachi instead of dumping everyone into today.
const ENROLL_MONTH_BUCKETS = [7, 9, 10, 12, 13, 15];

function assignCreatedAt(plan) {
  const now = new Date();
  let idx = 0;
  ENROLL_MONTH_BUCKETS.forEach((count, bucketIdx) => {
    const monthsAgo = ENROLL_MONTH_BUCKETS.length - 1 - bucketIdx;
    for (let k = 0; k < count && idx < plan.length; k++, idx++) {
      const day = 3 + ((idx * 5) % 25);
      plan[idx].createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 11, 0, 0);
    }
  });
  for (; idx < plan.length; idx++) plan[idx].createdAt = now;
}

async function seedStudents(allPlans) {
  const combined = [];
  for (const p of allPlans) combined.push(...p.students);
  assignCreatedAt(combined);

  let inserted = 0;
  const enrolledByCity = {};
  for (const p of allPlans) enrolledByCity[p.city] = [];

  for (const p of allPlans) {
    for (const s of p.students) {
      let doc = await Student.findOne({ cnic: s.cnic });
      if (!doc) {
        doc = await Student.create(s);
        inserted++;
      }
      if (doc.status === 'enrolled') enrolledByCity[p.city].push(doc);
    }
  }
  return { inserted, enrolledByCity };
}

const WINDOW_DAYS = 45;
function statusForDay(presentProb, leaveShare) {
  const r = Math.random();
  if (r < presentProb) return 'present';
  if (r < presentProb + (1 - presentProb) * leaveShare) return 'leave';
  return 'absent';
}

async function seedAttendance(enrolledByCity, campusNameByCity) {
  const docs = [];
  for (const city of Object.keys(enrolledByCity)) {
    const list = enrolledByCity[city];
    list.forEach((student, i) => {
      student._baselineRate = 0.72 + (i % 6) * 0.04; // spreads 0.72..0.92
    });
    for (const student of list) {
      for (let idx = 0; idx < WINDOW_DAYS; idx++) {
        const date = daysAgo(WINDOW_DAYS - 1 - idx);
        docs.push({
          student: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          course: student.course,
          campus: campusNameByCity[city],
          date,
          status: statusForDay(student._baselineRate, 0.15),
        });
      }
    }
  }

  const studentIds = [...new Set(docs.map((d) => String(d.student)))];
  if (studentIds.length === 0) return { inserted: 0, skipped: 0 };
  const existing = await StudentAttendance.find({ student: { $in: studentIds } }, 'student date').lean();
  const existingKeys = new Set(existing.map((e) => `${e.student}_${startOfDay(e.date).getTime()}`));
  const toInsert = docs.filter((d) => !existingKeys.has(`${d.student}_${d.date.getTime()}`));
  if (toInsert.length > 0) await StudentAttendance.insertMany(toInsert, { ordered: false });
  return { inserted: toInsert.length, skipped: docs.length - toInsert.length };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const allPlans = [];
  const campusNameByCity = {};
  for (const plan of CITY_PLANS) {
    const campus = await ensureCampus(plan);
    campusNameByCity[plan.city] = campus.name;

    const trainerResult = await seedTrainers(plan, campus._id);
    const slotResult = await seedSlots(plan, campus._id, trainerResult.names);
    const students = buildStudentPlan(plan, campus._id, slotResult.slots);

    allPlans.push({ city: plan.city, students });
    console.log(`${plan.city}: trainers +${trainerResult.inserted}, slots +${slotResult.inserted}`);
  }

  const studentResult = await seedStudents(allPlans);
  const attendanceResult = await seedAttendance(studentResult.enrolledByCity, campusNameByCity);

  console.log('--- Seed results ---');
  console.log(`Students inserted: ${studentResult.inserted}`);
  console.log(`StudentAttendance inserted: ${attendanceResult.inserted} (skipped: ${attendanceResult.skipped})`);
  console.log('--- Resulting totals ---');
  console.log(`Campus: ${await Campus.countDocuments()}`);
  console.log(`Student: ${await Student.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
