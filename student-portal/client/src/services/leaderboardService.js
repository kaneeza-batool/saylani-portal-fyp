import api from './authService';

export async function getFullLeaderboard() {
  const { data } = await api.get('/leaderboard');
  return data;
}
