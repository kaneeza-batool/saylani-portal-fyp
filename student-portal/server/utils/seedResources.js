require('dotenv').config();

const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');

// There's no dedicated Resource model (see resourceController.js) — the
// Resource Library page is entirely derived from Assignment.referenceLinks,
// title/source inferred from the URL itself. So "seeding resources" means
// populating referenceLinks on the assignments seedAssignments.js already
// created, not creating a new kind of document.
//
// Every URL below was verified live (curl, 200) before being added here —
// one of the four AI & Data Science assignments shipped with a fabricated
// docs.google.com placeholder link (a made-up doc id, 404s) from the
// original seed; this replaces it. A dead download link is worse than an
// empty Resources tab, so nothing here is guessed.
//
// title matching against already-created Assignment docs, not a fresh
// create — idempotent: only appends a URL if it isn't already present.
const ADDITIONAL_LINKS = {
  // Both this and Linear Regression's pre-existing pandas/numpy landing-page
  // links resolve their last URL segment to a real title on their own
  // (inferTitle only reads the URL, there's nowhere else to put one) — picked
  // a specific matplotlib tutorial page rather than its docs *index*, since
  // ".../index.html" collides with pandas' own "index.html" link and both
  // would render the identical, uninformative title "Index".
  'Exploratory Data Analysis on Student Enrollment Trends': [
    'https://matplotlib.org/stable/tutorials/pyplot.html',
    'https://seaborn.pydata.org/tutorial.html',
  ],
  'Linear Regression from Scratch': ['https://scikit-learn.org/stable/supervised_learning.html'],
  // The original seed's link here was a fabricated docs.google.com
  // placeholder (404). Replaced outright, not appended to.
  'Capstone Project Proposal': { replace: true, links: ['https://en.wikipedia.org/wiki/Feature_engineering'] },
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log('Seeding resource links onto existing assignments...');
  let touched = 0;

  for (const [title, entry] of Object.entries(ADDITIONAL_LINKS)) {
    const assignment = await Assignment.findOne({ title });
    if (!assignment) {
      console.log(`  "${title}": no matching assignment found — skipping (run "npm run seed:assignments" first?).`);
      continue;
    }

    const isReplace = !Array.isArray(entry);
    const newLinks = isReplace ? entry.links : entry;

    if (isReplace) {
      const alreadyReplaced = newLinks.every((l) => assignment.referenceLinks.includes(l));
      if (alreadyReplaced) {
        console.log(`  "${title}": already has the fixed link. Skipping.`);
        continue;
      }
      assignment.referenceLinks = newLinks;
    } else {
      const toAdd = newLinks.filter((l) => !assignment.referenceLinks.includes(l));
      if (toAdd.length === 0) {
        console.log(`  "${title}": already has these links. Skipping.`);
        continue;
      }
      assignment.referenceLinks = [...assignment.referenceLinks, ...toAdd];
    }

    await assignment.save();
    touched += 1;
    console.log(`  "${title}": referenceLinks now [${assignment.referenceLinks.join(', ')}]`);
  }

  console.log(`Done. ${touched} assignment(s) updated.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
