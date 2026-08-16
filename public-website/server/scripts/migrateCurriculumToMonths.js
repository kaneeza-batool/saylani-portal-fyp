// One-time migration: rewrites every course's curriculum from the old flat
// {module, topics} shape into a month-by-month {monthNumber, title, topics}
// shape (see the Course model comment, 2026-08-14). Existing modules are
// spread across the course's actual duration in months so nothing is lost:
//   - duration months >= module count: each module gets a contiguous span
//     of months, splitting its topics across that span.
//   - duration months < module count: multiple modules collapse into a
//     single month (title-joined, topics concatenated).
// Uses the raw collection driver (not the Mongoose model) for both read and
// write, so it works regardless of which curriculum shape is currently
// live on the schema. Safe to re-run: courses already in the new shape
// (entries have monthNumber) are skipped.
require('dotenv').config();
const mongoose = require('mongoose');

const monthsFromDuration = (duration) => (duration.includes('Year') ? 12 : parseInt(duration, 10));

function chunkArray(arr, parts) {
  const out = [];
  for (let j = 0; j < parts; j++) {
    const start = Math.floor((j * arr.length) / parts);
    const end = Math.floor(((j + 1) * arr.length) / parts);
    out.push(arr.slice(start, end));
  }
  return out;
}

function buildMonthlyOutline(modules, totalMonths) {
  const M = modules.length;
  const N = totalMonths;
  if (!M || !N || N < 1) return [];

  // monthToModules[i] = module indices assigned to month i
  const monthToModules = Array.from({ length: N }, () => []);
  if (N >= M) {
    // Enough months to give every module its own span: walk months in
    // order, each picks a module index proportional to its position.
    for (let i = 0; i < N; i++) {
      monthToModules[i].push(Math.floor((i * M) / N));
    }
  } else {
    // Fewer months than modules: walk modules in order, each lands on a
    // month proportional to its position — multiple modules can share one.
    for (let m = 0; m < M; m++) {
      monthToModules[Math.floor((m * N) / M)].push(m);
    }
  }

  // moduleToMonths[m] = ordered list of month indices referencing module m
  const moduleToMonths = {};
  monthToModules.forEach((moduleIdxs, i) => moduleIdxs.forEach((m) => {
    (moduleToMonths[m] = moduleToMonths[m] || []).push(i);
  }));

  // Modules spanning multiple months get their topics split across that
  // span (falls back to repeating the full list if there aren't enough
  // topics to split without an empty chunk).
  const moduleTopicChunks = {};
  Object.entries(moduleToMonths).forEach(([m, monthIdxs]) => {
    const span = monthIdxs.length;
    const topics = modules[m].topics || [];
    moduleTopicChunks[m] = span > 1 && topics.length >= span
      ? chunkArray(topics, span)
      : Array.from({ length: span }, () => topics);
  });

  return monthToModules.map((moduleIdxs, i) => {
    if (moduleIdxs.length === 1) {
      const m = moduleIdxs[0];
      const posInSpan = moduleToMonths[m].indexOf(i);
      const title = posInSpan === 0 ? modules[m].module : `${modules[m].module} (Continued)`;
      return { monthNumber: i + 1, title, topics: moduleTopicChunks[m][posInSpan] };
    }
    return {
      monthNumber: i + 1,
      title: moduleIdxs.map((m) => modules[m].module).join(' & '),
      topics: moduleIdxs.flatMap((m) => modules[m].topics || []),
    };
  });
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const collection = mongoose.connection.collection('courses');
  const courses = await collection.find({}).toArray();

  let migrated = 0;
  let skipped = 0;
  for (const course of courses) {
    const curriculum = course.curriculum || [];
    const alreadyMigrated = curriculum.length > 0 && curriculum[0].monthNumber !== undefined;
    if (alreadyMigrated) {
      skipped += 1;
      continue;
    }
    const totalMonths = monthsFromDuration(course.duration || '');
    const newCurriculum = buildMonthlyOutline(curriculum, totalMonths);
    await collection.updateOne({ _id: course._id }, { $set: { curriculum: newCurriculum } });
    migrated += 1;
    console.log(`Migrated "${course.title}" — ${curriculum.length} modules -> ${newCurriculum.length} months`);
  }

  console.log(`Done. Migrated ${migrated}, skipped ${skipped} (already in month shape).`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Curriculum migration failed:', err);
  process.exit(1);
});
