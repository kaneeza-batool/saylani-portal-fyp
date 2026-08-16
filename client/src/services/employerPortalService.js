import api from './authService';

export async function getMyEmployerProfile() {
  const { data } = await api.get('/employer/profile');
  return data.employer;
}

export async function getMyJobs() {
  const { data } = await api.get('/employer/jobs');
  return data.items;
}

export async function createMyJob(payload) {
  const { data } = await api.post('/employer/jobs', payload);
  return data;
}

export async function updateMyJob(id, payload) {
  const { data } = await api.patch(`/employer/jobs/${id}`, payload);
  return data;
}

export async function getMyJobApplications(jobId) {
  const { data } = await api.get('/employer/applications', { params: jobId ? { job: jobId } : {} });
  return data.items;
}

export async function updateMyJobApplicationStatus(id, status) {
  const { data } = await api.patch(`/employer/applications/${id}/status`, { status });
  return data.item;
}
