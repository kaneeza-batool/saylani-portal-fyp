// One-off backfill: creates CourseModule records for real (login-capable)
// enrolled/completed students, so Progress %, Certificate eligibility, and
// Skill Passport — all of which key off CourseModule — stop being
// permanently stuck at 0%/empty for every student. Nothing anywhere ever
// built a way to populate this collection (no trainer or admin UI exists
// for it — see the audit that led to this script), so this fills it once
// from data that already exists rather than leaving it fabricated-forever
// or building a whole new curriculum-authoring feature.
//
// Idempotent: skips any student who already has CourseModule docs for
// their course, so it's safe to re-run (e.g. after new students enroll).
//
// Topic completion is a real, defensible proxy — not invented — derived
// from the student's own actual attendance %: if they've attended 69% of
// classes, the first 69% of their course's topics (in curriculum order)
// are marked complete. It's an estimate, not trainer-verified ground
// truth, but it's grounded in real data already in the DB, and a student
// with zero attendance records correctly gets zero completed topics
// rather than a fabricated number.
require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const CourseModule = require('../models/CourseModule');
const StudentPortalCourse = require('../models/Course'); // studentportal_courses — the real FK target for CourseModule.courseId

// student-portal's own Course collection is keyed by the short names used
// everywhere else (Student.course, Trainer.course, Slot.course — see
// seedCourseCatalog.js), but the only catalog with real curriculum content
// is the public-website/main-app Course model, whose titles are unrelated
// marketing copy ("Web Engineering with AI Tools (Full-Stack)", etc.) with
// no shared key to join on. This map is a manual, judgment-call pairing
// between the two vocabularies — picked by closest subject match, not
// auto-derived. Any short name with no reasonable catalog match (Digital
// Marketing — there is no marketing course in the catalog at all) is
// deliberately left unmapped and skipped below, rather than guessing.
const SHORT_NAME_TO_CATALOG_TITLE = {
  'Web Development': 'Web Engineering with AI Tools (Full-Stack)',
  'AI & Data Science': 'Machine Learning & Predictive Models',
  'Graphic Designing': 'Graphic Communication & Brand Assets',
  'Mobile App Development (Flutter)': 'Cross-Platform Mobile App Engineering',
  'UI/UX Design': 'Advanced UI/UX Digital Product Design',
  'Cybersecurity Fundamentals': 'Cyber Security & Network Defense',
};

async function getAttendancePercentage(studentId, course) {
  const records = await StudentAttendance.find({ student: studentId, course }, 'status').lean();
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const denominator = present + absent;
  return denominator > 0 ? present / denominator : 0;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Main app's Course model isn't registered in this app's mongoose
  // connection — declare it locally with just the fields this script
  // reads, same "read-only mirror" convention every cross-app read in this
  // codebase already uses (e.g. this app's own Campus.js).
  const CatalogCourseSchema = new mongoose.Schema(
    { title: String, curriculum: [{ monthNumber: Number, title: String, topics: [String] }] },
    { collection: 'courses' }
  );
  const CatalogCourse = mongoose.models.CatalogCourse || mongoose.model('CatalogCourse', CatalogCourseSchema);

  const students = await Student.find({
    status: { $in: Student.PORTAL_ACCESS_STATUSES },
    password: { $exists: true, $ne: null },
  }).select('name course');

  let backfilled = 0;
  let skippedNoCurriculum = 0;
  let skippedAlreadyDone = 0;

  for (const student of students) {
    if (!student.course) continue;

    const catalogTitle = SHORT_NAME_TO_CATALOG_TITLE[student.course];
    if (!catalogTitle) {
      skippedNoCurriculum++;
      continue;
    }

    const catalogCourse = await CatalogCourse.findOne({ title: catalogTitle }).lean();
    const months = catalogCourse?.curriculum || [];
    if (months.length === 0) {
      skippedNoCurriculum++;
      continue;
    }

    // The FK CourseModule.courseId actually points to — upsert so this
    // script alone is enough to run cold, without needing
    // seedCourseCatalog.js as a separate manual step first.
    const spCourse = await StudentPortalCourse.findOneAndUpdate(
      { name: student.course },
      { $setOnInsert: { name: student.course } },
      { upsert: true, returnDocument: 'after' }
    );

    const alreadyDone = await CourseModule.exists({ student: student._id, courseId: spCourse._id });
    if (alreadyDone) {
      skippedAlreadyDone++;
      continue;
    }

    const attendanceRatio = await getAttendancePercentage(student._id, student.course);
    const allTopics = months.flatMap((m) => m.topics.map((t) => ({ monthNumber: m.monthNumber, topicName: t })));
    const completeCount = Math.round(attendanceRatio * allTopics.length);

    let topicIndex = 0;
    const moduleDocs = months.map((m) => ({
      student: student._id,
      courseId: spCourse._id,
      moduleName: m.title,
      order: m.monthNumber,
      topics: m.topics.map((t) => {
        const isCompleted = topicIndex < completeCount;
        topicIndex++;
        return { topicName: t, isCompleted };
      }),
    }));

    await CourseModule.insertMany(moduleDocs);
    backfilled++;
    console.log(`Backfilled ${moduleDocs.length} module(s) for ${student.name} (${student.course}, ${Math.round(attendanceRatio * 100)}% attendance -> ${completeCount}/${allTopics.length} topics complete)`);
  }

  console.log(`\nDone. Backfilled: ${backfilled}, skipped (no curriculum mapping): ${skippedNoCurriculum}, skipped (already done): ${skippedAlreadyDone}, total real students checked: ${students.length}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
