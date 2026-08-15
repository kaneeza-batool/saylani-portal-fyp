import api from './authService';

export async function getFullLeaderboard(courseId) {
  const { data } = await api.get(`/leaderboard/${courseId}`);
  return data;
}
