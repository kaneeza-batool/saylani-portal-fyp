import api from './authService';

export async function fetchApplications({ search = '', status = 'all', job = 'all', sort = 'recent', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/job-applications', { params: { search, status, job, sort, page, limit } });
  return data;
}

export async function fetchApplication(id) {
  const { data } = await api.get(`/admin/job-applications/${id}`);
  return data.item;
}

export async function updateApplicationStatus(id, status) {
  const { data } = await api.patch(`/admin/job-applications/${id}/status`, { status });
  return data.item;
}

export async function deleteApplication(id) {
  await api.delete(`/admin/job-applications/${id}`);
}

export async function fetchJobOptions() {
  const { data } = await api.get('/admin/job-applications/jobs-options');
  return data.items;
}
