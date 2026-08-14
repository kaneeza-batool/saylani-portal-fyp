import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export async function fetchPublicJobs() {
  const { data } = await publicApi.get('/public/jobs');
  return data.items;
}

export async function fetchPublicJob(id) {
  const { data } = await publicApi.get(`/public/jobs/${id}`);
  return data.item;
}

export async function submitApplication(jobId, formData) {
  const { data } = await publicApi.post(`/public/jobs/${jobId}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.item;
}

export async function checkApplicationStatus(email) {
  const { data } = await publicApi.post('/public/applications/status', { email });
  return data.items;
}
