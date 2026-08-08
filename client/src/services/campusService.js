import api from './authService';

export async function fetchCampuses({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/campuses', { params: { search, status, page, limit } });
  return data;
}

export async function createCampus(payload) {
  const { data } = await api.post('/admin/campuses', payload);
  return data.item;
}

export async function updateCampus(id, payload) {
  const { data } = await api.patch(`/admin/campuses/${id}`, payload);
  return data.item;
}

export async function deleteCampus(id) {
  await api.delete(`/admin/campuses/${id}`);
}
