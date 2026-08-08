import api from './authService';

export async function fetchEmployers({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/employers', { params: { search, status, page, limit } });
  return data;
}

export async function createEmployer(payload) {
  const { data } = await api.post('/admin/employers', payload);
  return data.item;
}

export async function updateEmployer(id, payload) {
  const { data } = await api.patch(`/admin/employers/${id}`, payload);
  return data.item;
}

export async function deleteEmployer(id) {
  await api.delete(`/admin/employers/${id}`);
}
