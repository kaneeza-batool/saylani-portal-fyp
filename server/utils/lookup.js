// Shared helper for the 3 status-check endpoints (entry test, results, ID
// card): a visitor may type either their 13-digit CNIC or the reference/
// card ID they were issued, so build a query that matches whichever shape
// the input is, instead of forcing the visitor to know which field to use.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildIdentifierQuery(identifier, { cnicField = 'cnic', refField = 'referenceNumber' } = {}) {
  const trimmed = (identifier || '').trim();
  if (/^\d{13}$/.test(trimmed)) {
    return { [cnicField]: trimmed };
  }
  return { [refField]: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') };
}

module.exports = { escapeRegex, buildIdentifierQuery };
