// Shared by every controller that builds a search RegExp from raw user
// input — without this, a search term containing a regex metacharacter
// (e.g. a lone "(") throws "Invalid regular expression" and 500s the route.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
