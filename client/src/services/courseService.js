import api from './authService';

export async function fetchCourses({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/courses', { params: { search, status, page, limit } });
  return data;
}

export async function createCourse(payload) {
  const { data } = await api.post('/admin/courses', payload);
  return data.item;
}

export async function updateCourse(id, payload) {
  const { data } = await api.patch(`/admin/courses/${id}`, payload);
  return data.item;
}

export async function deleteCourse(id) {
  await api.delete(`/admin/courses/${id}`);
}
