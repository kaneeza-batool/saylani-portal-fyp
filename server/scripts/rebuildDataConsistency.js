// One-off data-consistency rebuild for the shared Atlas `titan-portal` database.
// Idempotent — safe to re-run; every phase checks current state before writing.
// Usage: ATLAS_URI=<uri> node scripts/rebuildDataConsistency.js [--execute]
// (no --execute = dry run, reports what it would do without writing)

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const DEFAULT_TRAINER_PASSWORD = 'Trainer123!';
const DEFAULT_STUDENT_PASSWORD = 'Student123!';
const TAHIRA_ID = new ObjectId('6a867a80edb4ad034e6f96a6');
const EXPLICIT_TRAINER_LOGIN_EMAILS = ['amna.hussain@titan-demo.com', 'ahmed.raza@titan-demo.com'];

const QUALIFICATIONS = [
  'Matric (Science)',
  'Intermediate (FSc Pre-Engineering)',
  'Intermediate (ICS)',
  'Intermediate (Commerce)',
  'Bachelors',
];
const PROFICIENCY = ['beginner', 'intermediate', 'advanced'];
const COMPANIES = ['Systems Ltd', 'NetSol Technologies', 'Folio3', 'Techlogix', 'Contour Software', 'Freelance'];
const JOB_TITLES = {
  'Web Development': ['Junior Web Developer', 'Front-End Developer'],
  'AI & Data Science': ['Junior Data Analyst', 'ML Trainee'],
  'Graphic Designing': ['Junior Graphic Designer', 'Visual Designer'],
  'Mobile App Development (Flutter)': ['Junior Flutter Developer', 'Mobile App Developer'],
  'Digital Marketing': ['Social Media Executive', 'SEO Associate'],
  'UI/UX Design': ['Junior UI/UX Designer', 'Product Design Intern'],
  'Cybersecurity Fundamentals': ['SOC Analyst (Entry-Level)', 'IT Security Support'],
};

const EMPTY_PERMISSIONS = {
  STUDENT: { read: false, write: false, update: false },
  ATTENDANCE_VIEW: { read: false, write: false },
  ATTENDANCE_MARK: { read: false, write: false, update: false },
  ATTENDANCE_ADD_MULTI: { read: false, write: false, update: false },
  TRAINER: { read: false, write: false },
  TRAINER_ATTENDANCE_MARK: { read: false, write: false, update: false },
  TRAINER_ATTENDANCE_VIEW: { read: false, write: false },
  BATCH: { read: false, write: false, update: false },
  ADMISSIONS: { read: false, write: false, update: false },
  FEEDBACK: { read: false },
  ALERTS: { read: false },
  AUDIT: { read: false },
  FEES: { read: false, update: false },
};

const ASSIGNMENT_CONTENT = {
  'Web Development': [
    { title: 'Build a Responsive Portfolio Page', description: 'Build a single-page personal portfolio using semantic HTML5 and CSS Grid/Flexbox, responsive from mobile to desktop.' },
  ],
  'Graphic Designing': [
    { title: 'Brand Identity Mini-Kit', description: 'Design a logo, color palette, and one social media post for a fictional local brand using Illustrator/Photoshop.' },
  ],
  'Mobile App Development (Flutter)': [
    { title: 'Build a To-Do List App', description: 'Build a Flutter to-do app with local state, add/edit/delete, and persistent storage using shared_preferences.' },
  ],
  'Digital Marketing': [
    { title: 'One-Week Social Media Campaign Plan', description: 'Draft a 7-day content calendar and ad targeting plan for a fictional small business launch on Meta Ads.' },
  ],
  'Cybersecurity Fundamentals': [
    { title: 'Network Vulnerability Scan Report', description: 'Run an Nmap scan against a lab target VM and write a short report on discovered open ports and risks.' },
  ],
};

const QUIZ_CONTENT = {
  'Graphic Designing': {
    module: 'Module 1: Design Fundamentals',
    title: 'Design Fundamentals Quiz',
    questions: [
      { questionText: 'Which color model is used for print design?', options: ['RGB', 'CMYK', 'HSB', 'Pantone-only'], correctOptionIndex: 1, marks: 10, explanation: 'CMYK is the standard subtractive color model for print.' },
    ],
  },
  'Mobile App Development (Flutter)': {
    module: 'Module 1: Dart Fundamentals',
    title: 'Dart Basics Quiz',
    questions: [
      { questionText: 'Which keyword is used to define an immutable variable in Dart?', options: ['var', 'final', 'dynamic', 'let'], correctOptionIndex: 1, marks: 10, explanation: '`final` variables can only be set once.' },
    ],
  },
  'Digital Marketing': {
    module: 'Module 1: Marketing Fundamentals',
    title: 'SEO Basics Quiz',
    questions: [
      { questionText: 'What does SEO stand for?', options: ['Search Engine Optimization', 'Site Element Ordering', 'Search Engine Output', 'Statistical Engine Overview'], correctOptionIndex: 0, marks: 10, explanation: 'SEO = Search Engine Optimization.' },
    ],
  },
  'UI/UX Design': {
    module: 'Module 1: UX Research',
    title: 'UX Fundamentals Quiz',
    questions: [
      { questionText: 'What is a persona in UX design?', options: ['A code library', 'A fictional user profile representing a user segment', 'A color palette', 'A wireframe tool'], correctOptionIndex: 1, marks: 10, explanation: 'Personas represent real user segments to guide design decisions.' },
    ],
  },
  'Cybersecurity Fundamentals': {
    module: 'Module 1: Security Fundamentals',
    title: 'Security Basics Quiz',
    questions: [
      { questionText: 'What does the "C" in the CIA triad stand for?', options: ['Control', 'Confidentiality', 'Compliance', 'Cryptography'], correctOptionIndex: 1, marks: 10, explanation: 'CIA = Confidentiality, Integrity, Availability.' },
    ],
  },
};

const FEEDBACK_COMMENTS = [
  'Explains concepts clearly and answers questions patiently.',
  'Good pace, but sometimes moves fast on harder topics.',
  'Very engaging sessions, learned a lot.',
  'Would appreciate more practical examples.',
  'One of the best trainers I have had.',
  '',
  '',
];

function log(...args) {
  console.log(...args);
}

async function main() {
  const dryRun = process.argv[2] !== '--execute';
  const client = new MongoClient(process.env.ATLAS_URI, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db();
  log(dryRun ? '=== DRY RUN ===' : '=== EXECUTING ===');

  const campuses = await db.collection('campus').find({}).toArray();
  const karachi = campuses.find((c) => c.name.includes('Karachi'));
  const campusNameById = new Map(campuses.map((c) => [String(c._id), c.name]));

  // ================= STEP 2: AI & Data Science @ Karachi =================
  log('\n##### STEP 2: AI & Data Science slot @ Karachi #####');
  let aiKarachiSlot = await db.collection('slots').findOne({ course: 'AI & Data Science', campus: karachi._id });
  if (!aiKarachiSlot) {
    const doc = {
      schedule: 'Mon 02:00 PM - 04:00 PM | Thu 02:00 PM - 04:00 PM',
      trainer: 'Nadia Malik',
      assignedTrainer: null,
      course: 'AI & Data Science',
      campus: karachi._id,
      seatsTotal: 30,
      seatsFilled: 0,
      gender: 'Mixed',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    log('  Creating slot:', JSON.stringify(doc));
    if (!dryRun) {
      const res = await db.collection('slots').insertOne(doc);
      aiKarachiSlot = { ...doc, _id: res.insertedId };
    } else {
      aiKarachiSlot = { ...doc, _id: new ObjectId() };
    }
  } else {
    log('  Slot already exists, skipping create:', aiKarachiSlot._id);
  }

  const aiOrphans = await db.collection('students').find({ course: 'AI & Data Science', campus: karachi._id, batch: null }).toArray();
  log(`  AI & Data Science / Karachi orphans found: ${aiOrphans.length}`);
  for (const s of aiOrphans) {
    log(`    assigning ${s.name} (${s._id}) -> slot ${aiKarachiSlot._id}`);
    if (!dryRun) await db.collection('students').updateOne({ _id: s._id }, { $set: { batch: aiKarachiSlot._id } });
  }

  // ================= STEP 2b: Reactivate the Sukkur Digital Marketing slot =================
  // Discovered during dry-run: this slot is the ONLY Digital Marketing slot at
  // Sukkur and was marked inactive, leaving that course/campus with zero active
  // coverage (a gap Part 1's audit never checked, since it didn't look at
  // `status`). Everything else about the slot is correct (real trainer, right
  // course/campus) — reactivating the real slot rather than creating a duplicate.
  log('\n##### STEP 2b: Reactivate Sukkur Digital Marketing slot (was incorrectly inactive) #####');
  const dmSukkurSlot = await db.collection('slots').findOne({ course: 'Digital Marketing', campus: { $ne: karachi._id }, trainer: 'Rabia Siddiqui' });
  if (dmSukkurSlot && dmSukkurSlot.status !== 'active') {
    log(`  Reactivating slot ${dmSukkurSlot._id} (was "${dmSukkurSlot.status}")`);
    if (!dryRun) await db.collection('slots').updateOne({ _id: dmSukkurSlot._id }, { $set: { status: 'active' } });
  } else if (dmSukkurSlot) {
    log(`  Slot ${dmSukkurSlot._id} already active — skipping`);
  } else {
    log('  WARNING: expected slot not found by trainer name "Rabia Siddiqui" — check manually');
  }

  // ================= STEP 3: Orphaned enrolled/completed/dropout students =================
  log('\n##### STEP 3: Assign orphaned non-applicant students to a matching batch #####');
  const orphans = await db.collection('students').find({ batch: null, status: { $in: ['enrolled', 'completed', 'dropout'] } }).toArray();
  log(`  Orphans found: ${orphans.length}`);
  for (const s of orphans) {
    const candidates = await db.collection('slots').find({ course: s.course, campus: s.campus, status: 'active' }).toArray();
    if (!candidates.length) {
      log(`    NO ACTIVE SLOT for ${s.name} (${s._id}) course=${s.course} campus=${campusNameById.get(String(s.campus))} — SKIPPED, needs manual attention`);
      continue;
    }
    let best = null;
    let bestCount = Infinity;
    for (const sl of candidates) {
      const cnt = await db.collection('students').countDocuments({ batch: sl._id });
      if (cnt < bestCount) {
        bestCount = cnt;
        best = sl;
      }
    }
    log(`    ${s.name} (${s._id}) -> slot ${best._id} (${best.course}, currently ${bestCount} students)`);
    if (!dryRun) await db.collection('students').updateOne({ _id: s._id }, { $set: { batch: best._id } });
  }

  // ================= STEP 4: Trainer logins =================
  log('\n##### STEP 4: Trainer logins #####');
  const activeSlotsForLogins = await db.collection('slots').find({ status: 'active' }).toArray();
  const slotTrainerNames = new Set(activeSlotsForLogins.map((s) => s.trainer).filter(Boolean));
  const allTrainers = await db.collection('trainers').find({}).toArray();
  const targetTrainers = allTrainers.filter((t) => slotTrainerNames.has(t.name) || EXPLICIT_TRAINER_LOGIN_EMAILS.includes(t.email));
  log(`  Target trainers (own a slot, or explicitly requested): ${targetTrainers.length}`);
  let createdLogins = 0;
  for (const t of targetTrainers) {
    const existing = await db.collection('users').findOne({ email: t.email, role: 'trainer' });
    if (existing) {
      log(`    ${t.name} <${t.email}> already has a login — skipping`);
      continue;
    }
    const hash = await bcrypt.hash(DEFAULT_TRAINER_PASSWORD, 12);
    const userDoc = {
      name: t.name,
      email: t.email,
      password: hash,
      role: 'trainer',
      campus_id: t.campus,
      permissions: EMPTY_PERMISSIONS,
      status: 'active',
      avatar_url: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    log(`    Creating login for ${t.name} <${t.email}>`);
    if (!dryRun) await db.collection('users').insertOne(userDoc);
    createdLogins++;
  }
  log(`  Logins created: ${createdLogins}. Default password for all new trainer logins: "${DEFAULT_TRAINER_PASSWORD}"`);

  // ================= STEP 5: Link assignedTrainer =================
  log('\n##### STEP 5: Link assignedTrainer on slots with only a free-text name #####');
  const slotsToLink = await db.collection('slots').find({ status: 'active' }).toArray();
  let linked = 0;
  let unlinkable = 0;
  for (const sl of slotsToLink) {
    if (!sl.trainer) continue;
    const t = await db.collection('trainers').findOne({ name: sl.trainer });
    if (!t) {
      log(`    Slot ${sl._id} (${sl.course}) trainer "${sl.trainer}" has no Trainer profile — cannot link`);
      unlinkable++;
      continue;
    }
    const u = await db.collection('users').findOne({ email: t.email, role: 'trainer' });
    if (!u) {
      log(`    Slot ${sl._id} (${sl.course}) trainer "${sl.trainer}" has no User login — cannot link`);
      unlinkable++;
      continue;
    }
    if (sl.assignedTrainer && String(sl.assignedTrainer) === String(u._id)) continue;
    log(`    Linking slot ${sl._id} (${sl.course}) -> ${t.name} (${u._id})`);
    if (!dryRun) await db.collection('slots').updateOne({ _id: sl._id }, { $set: { assignedTrainer: u._id } });
    linked++;
  }
  log(`  Newly linked: ${linked}. Still unlinkable (no profile/login): ${unlinkable}`);

  // ================= STEP 6: Fill or deactivate empty slots =================
  log('\n##### STEP 6: Fill or deactivate empty slots #####');
  const allActiveSlots = await db.collection('slots').find({ status: 'active' }).toArray();
  for (const sl of allActiveSlots) {
    const count = await db.collection('students').countDocuments({ batch: sl._id });
    if (count > 0) continue;
    const siblings = await db.collection('slots').find({ course: sl.course, campus: sl.campus, status: 'active', _id: { $ne: sl._id } }).toArray();
    let donor = null;
    let donorCount = 0;
    for (const sib of siblings) {
      const c = await db.collection('students').countDocuments({ batch: sib._id });
      if (c > donorCount) {
        donorCount = c;
        donor = sib;
      }
    }
    const moveN = donor ? Math.min(4, donorCount - 4) : 0;
    if (donor && moveN > 0) {
      const toMove = await db.collection('students').find({ batch: donor._id }).limit(moveN).toArray();
      log(`  Slot ${sl._id} (${sl.course}) empty — rebalancing ${toMove.length} student(s) from sibling slot ${donor._id}`);
      if (!dryRun) {
        for (const s of toMove) await db.collection('students').updateOne({ _id: s._id }, { $set: { batch: sl._id } });
      }
    } else if (siblings.length === 0) {
      // Last/only active slot for this course at this campus — never deactivate.
      // An active slot with 0 enrolments reads as "class open, not yet filled";
      // deactivating the last one reads as "we don't teach this here," which
      // contradicts the every-course-at-both-campuses target.
      log(`  Slot ${sl._id} (${sl.course} @ ${campusNameById.get(String(sl.campus))}) empty, but it's the ONLY active slot for this course at this campus — leaving active`);
    } else {
      log(`  Slot ${sl._id} (${sl.course} @ ${campusNameById.get(String(sl.campus))}) empty, no capacity to redistribute, but another active slot covers this course here — deactivating`);
      if (!dryRun) await db.collection('slots').updateOne({ _id: sl._id }, { $set: { status: 'inactive' } });
    }
  }

  // ================= STEP 7: Recompute seatsFilled =================
  log('\n##### STEP 7: Recompute seatsFilled (live counts) #####');
  const everySlot = await db.collection('slots').find({}).toArray();
  let recomputed = 0;
  for (const sl of everySlot) {
    const count = await db.collection('students').countDocuments({ batch: sl._id });
    if (sl.seatsFilled !== count) {
      log(`  Slot ${sl._id} (${sl.course}): seatsFilled ${sl.seatsFilled} -> ${count}`);
      if (!dryRun) await db.collection('slots').updateOne({ _id: sl._id }, { $set: { seatsFilled: count } });
      recomputed++;
    }
  }
  log(`  Slots corrected: ${recomputed} / ${everySlot.length}`);

  // ================= STEP 8: Student passwords =================
  log('\n##### STEP 8: Passwords for enrolled students with none #####');
  const needPw = await db.collection('students').find({ status: 'enrolled', $or: [{ password: { $exists: false } }, { password: null }] }).toArray();
  log(`  Enrolled students without a password: ${needPw.length}`);
  const studentPwHash = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 12);
  for (const s of needPw) {
    if (!dryRun) await db.collection('students').updateOne({ _id: s._id }, { $set: { password: studentPwHash } });
  }
  log(`  Default password for all newly-set student accounts: "${DEFAULT_STUDENT_PASSWORD}"`);

  // ================= STEP 9a: Attendance =================
  log('\n##### STEP 9a: Attendance for enrolled students with none #####');
  const enrolledStudents = await db.collection('students').find({ status: 'enrolled' }).toArray();
  let attendanceSeededFor = 0;
  for (const s of enrolledStudents) {
    const existingCount = await db.collection('studentattendances').countDocuments({ student: s._id });
    if (existingCount > 0) continue;
    const records = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let daysAdded = 0;
    while (daysAdded < 15) {
      cursor.setDate(cursor.getDate() - 1);
      if (cursor.getDay() === 0) continue; // skip Sunday
      const r = Math.random();
      const status = r < 0.85 ? 'present' : r < 0.95 ? 'absent' : 'leave';
      records.push({
        student: s._id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        course: s.course,
        campus: campusNameById.get(String(s.campus)) || '',
        date: new Date(cursor),
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      daysAdded++;
    }
    log(`  Seeding ${records.length} attendance records for ${s.name} (${s._id})`);
    if (!dryRun && records.length) await db.collection('studentattendances').insertMany(records);
    attendanceSeededFor++;
  }
  log(`  Students seeded: ${attendanceSeededFor}`);

  // ================= STEP 9b: Fee vouchers =================
  log('\n##### STEP 9b: Fee vouchers for students missing them #####');
  const feeEligible = await db.collection('students').find({ status: { $in: ['enrolled', 'completed', 'dropout'] } }).toArray();
  let voucherSeededFor = 0;
  const now = new Date();
  for (const s of feeEligible) {
    const cnt = await db.collection('feevouchers').countDocuments({ student: s._id });
    if (cnt > 0) continue;
    const vouchers = [];
    for (let i = 0; i < 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const dueDate = new Date(d.getFullYear(), d.getMonth(), 5);
      const voucherId = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(s._id).slice(-6)}${i}`;
      const status = i === 0 ? (Math.random() < 0.6 ? 'pending' : 'paid') : 'paid';
      vouchers.push({ student: s._id, month: monthLabel, amount: 6000, type: 'Monthly', dueDate, voucherId, status, createdAt: new Date(), updatedAt: new Date() });
    }
    log(`  Seeding ${vouchers.length} fee vouchers for ${s.name} (${s._id})`);
    if (!dryRun) await db.collection('feevouchers').insertMany(vouchers);
    voucherSeededFor++;
  }
  log(`  Students seeded: ${voucherSeededFor}`);

  // ================= STEP 10: Profile fields =================
  log('\n##### STEP 10: Populate empty profile fields (Tahira excluded) #####');
  const allStudentsForProfile = await db.collection('students').find({ _id: { $ne: TAHIRA_ID } }).toArray();
  let profilesFilled = 0;
  for (const s of allStudentsForProfile) {
    const set = {};
    if (!s.gender) set.gender = Math.random() < 0.55 ? 'male' : 'female';
    if (!s.dateOfBirth) {
      const age = 18 + Math.floor(Math.random() * 10);
      set.dateOfBirth = new Date(2026 - age, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 27));
    }
    if (!s.lastQualification) set.lastQualification = QUALIFICATIONS[Math.floor(Math.random() * QUALIFICATIONS.length)];
    if (s.computerProficiency == null) set.computerProficiency = PROFICIENCY[Math.floor(Math.random() * PROFICIENCY.length)];
    if (s.hasLaptop === null || s.hasLaptop === undefined) set.hasLaptop = Math.random() < 0.7;
    const finalEmploymentStatus = s.employmentStatus ?? set.employmentStatus;
    if (s.employmentStatus == null) {
      if (['completed', 'dropout'].includes(s.status)) set.employmentStatus = Math.random() < 0.5 ? 'employed' : 'unemployed';
      else if (s.status === 'enrolled') set.employmentStatus = 'unemployed';
    }
    if ((s.employmentStatus === 'employed' || set.employmentStatus === 'employed') && !s.companyName) {
      set.companyName = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
      const titles = JOB_TITLES[s.course] || ['Trainee'];
      set.jobTitle = titles[Math.floor(Math.random() * titles.length)];
      set.employmentStartDate = new Date(2026, Math.floor(Math.random() * 6), 1);
    }
    if (Object.keys(set).length) {
      profilesFilled++;
      if (!dryRun) await db.collection('students').updateOne({ _id: s._id }, { $set: set });
    }
  }
  log(`  Students with at least one field filled: ${profilesFilled} (out of ${allStudentsForProfile.length} eligible, Tahira excluded)`);

  // ================= STEP 11: Assignments, quizzes, feedback =================
  log('\n##### STEP 11: Assignments, quizzes, feedback #####');
  const trainerUserByEmail = new Map();
  for (const u of await db.collection('users').find({ role: 'trainer' }).toArray()) trainerUserByEmail.set(u.email, u);
  const trainersAll = await db.collection('trainers').find({}).toArray();

  function trainerUserIdForCourse(course) {
    const t = trainersAll.find((tr) => tr.course === course);
    if (!t) return null;
    const u = trainerUserByEmail.get(t.email);
    return u ? u._id : null;
  }

  let assignmentsCreated = 0;
  for (const [course, items] of Object.entries(ASSIGNMENT_CONTENT)) {
    const existing = await db.collection('assignments').countDocuments({ course });
    if (existing > 0) {
      log(`    ${course}: already has ${existing} assignment(s) — skipping`);
      continue;
    }
    const createdByTrainer = trainerUserIdForCourse(course);
    for (const item of items) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      const doc = { title: item.title, description: item.description, referenceLinks: [], dueDate, isHackathon: false, course, createdByTrainer, createdAt: new Date(), updatedAt: new Date() };
      log(`    Creating assignment "${item.title}" for ${course}`);
      if (!dryRun) await db.collection('assignments').insertOne(doc);
      assignmentsCreated++;
    }
  }
  log(`  Assignments created: ${assignmentsCreated}`);

  let quizzesCreated = 0;
  for (const [course, q] of Object.entries(QUIZ_CONTENT)) {
    const existing = await db.collection('studentportal_quizzes').countDocuments({ course });
    if (existing > 0) {
      log(`    ${course}: already has ${existing} quiz(zes) — skipping`);
      continue;
    }
    const createdByTrainer = trainerUserIdForCourse(course);
    const totalMarks = q.questions.reduce((sum, x) => sum + x.marks, 0);
    const doc = { course, module: q.module, title: q.title, questions: q.questions.map((x) => ({ ...x, _id: new ObjectId() })), totalMarks, durationMinutes: 20, createdByTrainer, createdAt: new Date(), updatedAt: new Date() };
    log(`    Creating quiz "${q.title}" for ${course}`);
    if (!dryRun) await db.collection('studentportal_quizzes').insertOne(doc);
    quizzesCreated++;
  }
  log(`  Quizzes created: ${quizzesCreated}`);

  log('\n  Feedback seeding:');
  const feedbackActiveSlots = await db.collection('slots').find({ status: 'active' }).toArray();
  let feedbackCreated = 0;
  function trainerBiasRating(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 1000;
    return 3.3 + (h % 150) / 100; // base rating 3.3 - 4.8, stable per trainer name
  }
  for (const sl of feedbackActiveSlots) {
    if (!sl.trainer) continue;
    const existingForSlot = await db.collection('feedbacks').countDocuments({ batch: sl._id });
    if (existingForSlot > 0) continue;
    const studentsInSlot = await db.collection('students').find({ batch: sl._id }).toArray();
    if (!studentsInSlot.length) continue;
    const raterCount = Math.min(studentsInSlot.length, 1 + Math.floor(Math.random() * 3));
    const base = trainerBiasRating(sl.trainer);
    const docs = [];
    for (let i = 0; i < raterCount; i++) {
      const student = studentsInSlot[i];
      let rating = Math.round(base + (Math.random() - 0.5) * 1.4);
      rating = Math.max(1, Math.min(5, rating));
      docs.push({
        student: student._id,
        batch: sl._id,
        trainer: sl.trainer,
        campus: sl.campus,
        rating,
        comment: FEEDBACK_COMMENTS[Math.floor(Math.random() * FEEDBACK_COMMENTS.length)],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    log(`    Seeding ${docs.length} feedback record(s) for trainer "${sl.trainer}" (slot ${sl._id})`);
    if (!dryRun && docs.length) await db.collection('feedbacks').insertMany(docs);
    feedbackCreated += docs.length;
  }
  log(`  Feedback records created: ${feedbackCreated}`);

  await client.close();
  log(dryRun ? '\n=== DRY RUN COMPLETE ===' : '\n=== DONE ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
