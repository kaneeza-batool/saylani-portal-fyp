// ============================================================
// Find Your Path — quiz questions + deterministic scoring logic.
// No external calls: every course gets a plain numeric score built
// from four independently-weighted factors so the result is always
// explainable and reproducible from the same answers.
// ============================================================

export const QUESTIONS = [
  {
    id: 'interest',
    question: 'What interests you most?',
    subtitle: "Pick the area that excites you, and we'll match it to a real program.",
    options: [
      { id: 'web', label: 'Building websites & apps', icon: '💻', categories: ['web'] },
      { id: 'data', label: 'Working with data & AI', icon: '📊', categories: ['data'] },
      { id: 'design', label: 'Design & creativity', icon: '🎨', categories: ['creative'] },
      { id: 'security', label: 'Networking & security', icon: '🔐', categories: ['security'] },
      { id: 'handson', label: 'Hands-on / practical skills', icon: '🛠️', categories: ['vocational', 'basic', 'cloud'] },
    ],
  },
  {
    id: 'coding',
    question: 'Do you have any coding experience?',
    subtitle: 'Be honest. We have strong tracks at every level.',
    options: [
      { id: 'none', label: 'None at all', icon: '🌱' },
      { id: 'little', label: 'A little', icon: '🌿' },
      { id: 'comfortable', label: 'Comfortable coding', icon: '🌳' },
    ],
  },
  {
    id: 'duration',
    question: 'How much time can you commit?',
    subtitle: 'Our programs range from a few months to a full year.',
    options: [
      { id: 'short', label: '3–4 months', icon: '⚡', range: [3, 4] },
      { id: 'medium', label: '5–6 months', icon: '📅', range: [5, 6] },
      { id: 'long', label: '8–12 months', icon: '🎯', range: [8, 12] },
    ],
  },
  {
    id: 'goal',
    question: "What's your goal?",
    subtitle: 'This helps us fine-tune the recommendation.',
    options: [
      { id: 'job', label: 'Get a job quickly', icon: '💼' },
      { id: 'deep', label: 'Build deep technical skills', icon: '🧠' },
      { id: 'freelance', label: 'Start freelancing / own business', icon: '🚀' },
      { id: 'explore', label: 'Explore / not sure yet', icon: '🔍' },
    ],
  },
];

// Category match is weighted highest, then coding-experience fit, then
// how well the course's duration lands in the requested range. Goal is
// kept as a small tie-breaker on top of those three, never enough on its
// own to override a category mismatch.
const WEIGHTS = { category: 100, coding: 40, duration: 30, goal: 20 };

// experience id -> { codingRequired: score out of 100 }
const CODING_FIT = {
  none: { true: 30, false: 100 },
  little: { true: 90, false: 80 },
  comfortable: { true: 100, false: 60 },
};

const FREELANCE_FRIENDLY_CATEGORIES = ['web', 'creative', 'basic', 'vocational'];

const monthsFromDuration = (duration) =>
  duration.includes('Year') ? 12 : parseInt(duration, 10);

const scoreCategory = (track, interestId) => {
  const option = QUESTIONS[0].options.find((o) => o.id === interestId);
  if (!option) return 0;
  if (track.category === option.categories[0]) return WEIGHTS.category;
  if (option.categories.includes(track.category)) return WEIGHTS.category * 0.6;
  return 0;
};

const scoreCoding = (track, codingId) => {
  const fit = CODING_FIT[codingId];
  if (!fit) return 0;
  return (fit[String(track.codingRequired)] / 100) * WEIGHTS.coding;
};

const scoreDuration = (track, durationId) => {
  const option = QUESTIONS[2].options.find((o) => o.id === durationId);
  if (!option) return 0;
  const [min, max] = option.range;
  const months = monthsFromDuration(track.duration);
  if (months >= min && months <= max) return WEIGHTS.duration;
  const distance = months < min ? min - months : months - max;
  return Math.max(WEIGHTS.duration - distance * 8, 0);
};

const scoreGoal = (track, goalId) => {
  const months = monthsFromDuration(track.duration);
  switch (goalId) {
    case 'job':
      return months <= 6 ? WEIGHTS.goal : WEIGHTS.goal * 0.3;
    case 'deep':
      return months >= 6 ? WEIGHTS.goal : WEIGHTS.goal * 0.3;
    case 'freelance':
      return FREELANCE_FRIENDLY_CATEGORIES.includes(track.category) ? WEIGHTS.goal : WEIGHTS.goal * 0.3;
    case 'explore':
      return !track.codingRequired ? WEIGHTS.goal : WEIGHTS.goal * 0.5;
    default:
      return 0;
  }
};

// Returns a full score breakdown per course so the result stays debuggable —
// each factor is visible on the object, not folded away.
export const scoreCourse = (track, answers) => {
  const categoryScore = scoreCategory(track, answers.interest);
  const codingScore = scoreCoding(track, answers.coding);
  const durationScore = scoreDuration(track, answers.duration);
  const goalScore = scoreGoal(track, answers.goal);
  return {
    track,
    categoryScore,
    codingScore,
    durationScore,
    goalScore,
    total: categoryScore + codingScore + durationScore + goalScore,
  };
};

export const getRecommendations = (courses, answers, limit = 2) => {
  const scored = courses
    .map((track) => scoreCourse(track, answers))
    .sort((a, b) => b.total - a.total);

  const results = [scored[0]];
  const runnerUp = scored[1];
  if (runnerUp && runnerUp.total >= scored[0].total * 0.75) {
    results.push(runnerUp);
  }
  return results.slice(0, limit);
};

const INTEREST_PHRASES = {
  web: 'building websites & apps',
  data: 'working with data & AI',
  design: 'design & creativity',
  security: 'networking & security',
  handson: 'hands-on, practical skills',
};

const CODING_PHRASES = {
  none: "you're starting with no coding background",
  little: 'you already have a little coding experience',
  comfortable: "you're already comfortable writing code",
};

const GOAL_PHRASES = {
  job: 'want to get into a job as quickly as possible',
  deep: 'want to build deep technical skills',
  freelance: 'want to freelance or start your own business',
  explore: "are still exploring your options",
};

export const explainRecommendation = (track, answers) => {
  const interestPhrase = INTEREST_PHRASES[answers.interest] || 'your interests';
  const codingPhrase = CODING_PHRASES[answers.coding] || 'your experience level';
  const goalPhrase = GOAL_PHRASES[answers.goal] || 'your goals';
  return `Since you're interested in ${interestPhrase}, ${codingPhrase}, and you ${goalPhrase}, this ${track.duration.toLowerCase()} program is a strong match.`;
};
