// Compares the canonical Student schema (server/models/Student.js) against
// the Student Portal mirror (student-portal/server/models/Student.js) and
// fails loudly if the canonical schema has a field the mirror doesn't
// declare — that's exactly the class of bug that made `status` invisible
// to Student Portal's auth gate (Mongoose strict mode silently drops any
// path a schema doesn't declare, on every read, even though the
// underlying document has the data).
//
// Each schema is loaded in its own child process: both files call
// mongoose.model('Student', ...) against the same global mongoose
// singleton, so requiring both in one process throws "Cannot overwrite
// `Student` model once compiled".
//
// Static check only — no DB connection, safe/fast to run anytime. Not
// wired into CI: this project has no test runner (`npm test` is a stub).

const path = require('path');
const { execFileSync } = require('child_process');

const CANONICAL_PATH = path.resolve(__dirname, '../models/Student.js');
const MIRROR_PATH = path.resolve(__dirname, '../../student-portal/server/models/Student.js');

function getSchemaFields(modelPath) {
  const script = `
    const Model = require(${JSON.stringify(modelPath)});
    console.log(JSON.stringify(Object.keys(Model.schema.paths)));
  `;
  const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

const canonicalFields = new Set(getSchemaFields(CANONICAL_PATH));
const mirrorFields = new Set(getSchemaFields(MIRROR_PATH));

// Mongoose adds these implicitly to every schema — not meaningful drift.
for (const implicit of ['_id', '__v']) {
  canonicalFields.delete(implicit);
  mirrorFields.delete(implicit);
}

const missingFromMirror = [...canonicalFields].filter((f) => !mirrorFields.has(f)).sort();
const extraInMirror = [...mirrorFields].filter((f) => !canonicalFields.has(f)).sort();

if (extraInMirror.length > 0) {
  console.log('Fields only in the Student Portal mirror (not in canonical — informational, not a failure):');
  extraInMirror.forEach((f) => console.log(`  + ${f}`));
  console.log('');
}

if (missingFromMirror.length > 0) {
  console.error('DRIFT DETECTED — the canonical Student schema has fields the Student Portal mirror does not declare.');
  console.error('These are silently dropped on every read through the mirror (Mongoose strict-mode default),');
  console.error('exactly the bug that made `status` invisible to the portal-access gate. Fields:\n');
  missingFromMirror.forEach((f) => console.error(`  - ${f}`));
  console.error('\nAdd each of these to student-portal/server/models/Student.js (read-only mirror declaration —');
  console.error('see the existing fields there for the pattern) before this check will pass.');
  process.exit(1);
}

console.log(`OK — all ${canonicalFields.size} canonical Student fields are declared in the Student Portal mirror.`);
process.exit(0);
