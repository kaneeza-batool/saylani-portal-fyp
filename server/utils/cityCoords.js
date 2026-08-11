// Static city -> lat/lng lookup for the cities used across CAMPUSES
// (Student.js) and campus records. No geocoding API needed for this.
const CITY_COORDS = {
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Lahore: { lat: 31.5497, lng: 74.3436 },
  Sukkur: { lat: 27.7052, lng: 68.8574 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
};

// Design-file CAMPUSES are named "<City> ... Campus" — map a full campus
// name to its city by checking which known city the name starts with.
function cityForCampusName(campusName) {
  const known = Object.keys(CITY_COORDS);
  return known.find((city) => campusName?.startsWith(city)) || null;
}

module.exports = { CITY_COORDS, cityForCampusName };
