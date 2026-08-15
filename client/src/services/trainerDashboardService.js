import api from './authService';

export async function getTrainerDashboard() {
  const { data } = await api.get('/trainer/dashboard');
  return data;
}
