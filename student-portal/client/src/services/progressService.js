import api from './authService';

export async function getProgress() {
  const { data } = await api.get('/progress');
  return data;
}
