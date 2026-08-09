import api from './authService';

export async function getMyWeekAgenda() {
  const { data } = await api.get('/agenda');
  return data;
}
