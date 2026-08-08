import api from './authService';

export async function fetchJobs({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/jobs', { params: { search, status, page, limit } });
  return data;
}

export async function createJob(payload) {
  const { data } = await api.post('/admin/jobs', payload);
  return data.item;
}

export async function updateJob(id, payload) {
  const { data } = await api.patch(`/admin/jobs/${id}`, payload);
  return data.item;
}

export async function deleteJob(id) {
  await api.delete(`/admin/jobs/${id}`);
}
