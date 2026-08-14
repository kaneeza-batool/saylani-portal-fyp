const Student = require('../models/Student');
const Campus = require('../models/Campus');
const Trainer = require('../models/Trainer');
const { CITY_COORDS, cityForCampusName } = require('../utils/cityCoords');

// Merges three independent counts (students via their campus ref's own city
// field, real Campus records via their own city field, trainers via their
// city field) into one per-city summary for the map. These collections
// aren't foreign-keyed to each other, so a city-name join is the honest
// way to combine them rather than pretending they're one dataset.
exports.getCampusMap = async (req, res) => {
  try {
    const [students, campuses, trainers] = await Promise.all([
      Student.find({}, 'campus').populate('campus', 'city'),
      Campus.find({}, 'name city status'),
      Trainer.find({}, 'city'),
    ]);

    const byCity = {};
    for (const city of Object.keys(CITY_COORDS)) {
      byCity[city] = { city, ...CITY_COORDS[city], studentCount: 0, campusCount: 0, trainerCount: 0, campuses: [] };
    }

    for (const s of students) {
      // Student.campus is an ObjectId ref (see Student.js), not a name
      // string — resolve through the populated Campus doc's own city field
      // rather than string-matching a name that isn't there.
      const city = s.campus?.city;
      if (city && byCity[city]) byCity[city].studentCount += 1;
    }
    for (const c of campuses) {
      const city = byCity[c.city] ? c.city : cityForCampusName(c.name);
      if (city && byCity[city]) {
        byCity[city].campusCount += 1;
        byCity[city].campuses.push({ name: c.name, status: c.status });
      }
    }
    for (const t of trainers) {
      if (byCity[t.city]) byCity[t.city].trainerCount += 1;
    }

    const cities = Object.values(byCity).filter((c) => c.studentCount || c.campusCount || c.trainerCount);

    return res.status(200).json({ cities });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load campus map data', error: err.message });
  }
};
