const mongoose = require('mongoose');

// Kept as a standalone record (not tied to a User login) — this is a CRUD
// page for trainer profiles, not the trainer-facing auth/attendance flows
// from the screenshots, which are separate, unbuilt features.
const trainerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    // required stays true as a safety net — the pre('validate') hook below
    // always fills this in for a new document before this check runs, so it
    // only ever fires if that hook somehow didn't (e.g. a future insertMany
    // call, which skips middleware by default).
    employeeId: { type: String, required: true, unique: true, trim: true },
    course: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Real, established city codes for the two currently-active campuses — NOT
// the same as the naive "first 3 letters" fallback below (Karachi's real
// trainers are already "TRN-KHI-*", airport-code style, not "TRN-KAR-*").
// Any campus not listed here (e.g. a newly expanded city) falls back to its
// own first-3-letters code, same convention seedExpansionCampuses.js uses.
const CITY_CODES = { Sukkur: 'SUK', Karachi: 'KHI' };
function cityCode(city) {
  return CITY_CODES[city] || String(city || '').slice(0, 3).toUpperCase() || 'GEN';
}

// Two responsibilities, both driven off `campus` rather than trusting
// whatever the client sent independently:
//  1. `city` always mirrors the referenced Campus's real city — a
//     free-typed city field that could silently disagree with the chosen
//     campus was exactly the kind of drift this closes off, same reasoning
//     as studentController locking `campus` server-side for a sub_admin.
//  2. `employeeId`, when not supplied, is auto-assigned as
//     `TRN-{cityCode}-{next sequence for that city}`, matching the format
//     every real trainer already has (TRN-SUK-013, TRN-KHI-008, ...) rather
//     than requiring an admin to invent one by hand.
trainerSchema.pre('validate', async function autoFieldsFromCampus() {
  if (this.campus && (this.isNew || this.isModified('campus'))) {
    const Campus = mongoose.model('Campus');
    const campusDoc = await Campus.findById(this.campus).select('city');
    if (campusDoc) this.city = campusDoc.city;
  }

  if (this.isNew && !this.employeeId) {
    const prefix = `TRN-${cityCode(this.city)}-`;
    const existing = await this.constructor
      .find({ employeeId: { $regex: `^${prefix}\\d+$` } })
      .select('employeeId')
      .lean();
    const maxSeq = existing.reduce((max, t) => {
      const n = parseInt(t.employeeId.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    this.employeeId = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Trainer', trainerSchema);
