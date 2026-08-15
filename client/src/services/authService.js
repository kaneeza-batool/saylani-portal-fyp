import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function updateMe(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.user;
}

export async function registerTrainer(payload) {
  const { data } = await api.post('/auth/register-trainer', payload);
  return data.user;
}

export async function fetchPublicCampuses() {
  const { data } = await api.get('/public/campuses');
  return data.items;
}

export default api;
