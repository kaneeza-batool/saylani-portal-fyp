// One-time migration: reads the existing client/src/data/courses.js static
// array and inserts every course into MongoDB via the new Course model.
// Safe to re-run: it skips migration entirely if the Course collection is
// not empty, so it never creates duplicates.
require('dotenv').config();
require('../utils/fixDns');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mongoose = require('mongoose');
const Course = require('../models/Course');

const coursesFilePath = path.resolve(__dirname, '../../client/src/data/courses.js');

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function loadTracksData() {
  const source = fs.readFileSync(coursesFilePath, 'utf8');
  const startMarker = 'export const TRACKS_DATA = ';
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find TRACKS_DATA export in courses.js');
  const arrayStart = startIdx + startMarker.length;
  const endMarker = '\n];';
  const endIdx = source.indexOf(endMarker, arrayStart);
  if (endIdx === -1) throw new Error('Could not find end of TRACKS_DATA array in courses.js');
  const arrayLiteralSource = source.slice(arrayStart, endIdx + 2);

  // The array is plain literal data (strings/numbers/booleans/nested arrays,
  // no imports or function calls), so it's safe to evaluate standalone.
  return vm.runInNewContext(`(${arrayLiteralSource})`);
}

async function migrate() {
  const tracksData = loadTracksData();
  if (!Array.isArray(tracksData) || tracksData.length !== 26) {
    throw new Error(`Expected 26 courses in courses.js, found ${tracksData.length}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const existingCount = await Course.countDocuments();
  if (existingCount > 0) {
    console.log(`Course collection already has ${existingCount} document(s). Skipping migration to avoid duplicates.`);
    await mongoose.disconnect();
    return;
  }

  const docs = tracksData.map((track) => ({
    title: track.title,
    slug: slugify(track.title),
    category: track.category,
    duration: track.duration,
    seats: track.seats,
    codingRequired: track.codingRequired,
    languages: track.languages,
    tools: track.tools,
    desc: track.desc,
    img: track.img,
    tags: track.tags,
    roadmap: track.roadmap,
    tagline: track.tagline,
    curriculum: track.curriculum,
    careerOutcomes: track.careerOutcomes,
    idealFor: track.idealFor,
    imageUrl: track.img,
    isActive: true,
  }));

  const result = await Course.insertMany(docs);
  console.log(`Migrated ${result.length} courses into MongoDB.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
