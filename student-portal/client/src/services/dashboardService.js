import api from './authService';

export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}
