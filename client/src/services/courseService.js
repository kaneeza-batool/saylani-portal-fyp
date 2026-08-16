import api from './authService';

// Read-only — course content is authored in the public website's own admin
// panel, which owns this collection. See server/routes/courseRoutes.js.
export async function fetchCourses({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/courses', { params: { search, status, page, limit } });
  return data;
}
