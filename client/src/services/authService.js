import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

export async function login(cnic, password) {
  const { data } = await api.post('/auth/login', { cnic, password });
  return data.student;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.student;
}

export async function verifyCnic(cnic) {
  const { data } = await api.post('/auth/verify-cnic', { cnic });
  return data;
}

export async function setPassword(cnic, password) {
  const { data } = await api.post('/auth/set-password', { cnic, password });
  return data.student;
}

export default api;
