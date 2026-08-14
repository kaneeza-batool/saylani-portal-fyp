const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5200';

// Course images are either a full external URL (migrated Unsplash photos) or
// a relative /uploads/... path served by the API (admin-uploaded images) —
// relative paths need the API origin prefixed or the browser resolves them
// against the client dev server instead.
const resolveImageUrl = (src) => {
  if (!src) return '';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default resolveImageUrl;
