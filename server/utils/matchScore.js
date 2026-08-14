// Lightweight, dependency-free candidate/job match score — keyword overlap
// between the job's requirements+description and the candidate's
// skills+experience+education text. Not real NLP, same "feels smart without
// a real ML service" spirit as the dropout-risk predictor.
const STOPWORDS = new Set([
  'the', 'and', 'or', 'a', 'an', 'in', 'on', 'of', 'to', 'for', 'with', 'is', 'are', 'be',
  'as', 'at', 'by', 'from', 'that', 'this', 'will', 'we', 'you', 'our', 'their', 'has', 'have',
  'years', 'year', 'experience', 'strong', 'ability', 'skills', 'skill', 'knowledge', 'work',
  'working', 'good', 'excellent', 'required', 'must', 'plus', 'etc', 'role', 'job', 'team',
]);

function tokenize(text) {
  return ((text || '').toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function computeMatchScore(job, candidate) {
  const jobText = [...(job.requirements || []), job.description || ''].join(' ');
  const jobTokens = new Set(tokenize(jobText));
  if (jobTokens.size === 0) return null;

  const candidateTokens = new Set(tokenize([candidate.skills, candidate.experience, candidate.education].join(' ')));
  let matches = 0;
  for (const t of jobTokens) if (candidateTokens.has(t)) matches++;

  return Math.round((matches / jobTokens.size) * 100);
}

module.exports = { computeMatchScore };
