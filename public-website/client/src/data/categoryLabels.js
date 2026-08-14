// Course category labels, shared by the public catalog pages and the admin
// course form. Kept separate from data/courses.js (now unused static data)
// since course records themselves live in MongoDB.
export const CATEGORY_LABELS = {
  basic: 'Basic Computer Operations',
  web: 'Web Engineering',
  data: 'Data Intelligence',
  cloud: 'Cloud Infrastructure',
  security: 'Networking & Security',
  creative: 'Creative Assets',
  vocational: 'Vocational Skills',
};

export default CATEGORY_LABELS;
