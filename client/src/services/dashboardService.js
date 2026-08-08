import api from './authService';

export async function getDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}
