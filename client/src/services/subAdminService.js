import api from './authService';

export async function fetchSubAdmins({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/subadmins', { params: { search, status, page, limit } });
  return data;
}

export async function createSubAdmin(payload) {
  const { data } = await api.post('/admin/subadmins', payload);
  return data.item;
}

export async function updateSubAdmin(id, payload) {
  const { data } = await api.patch(`/admin/subadmins/${id}`, payload);
  return data.item;
}

export async function deleteSubAdmin(id) {
  await api.delete(`/admin/subadmins/${id}`);
}
