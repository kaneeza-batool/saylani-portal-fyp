import api from './authService';

export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}

export async function getProgressInsight(courseId) {
  const { data } = await api.get(`/dashboard/${courseId}/insight`);
  return data;
}

export async function getLeaderboardPosition(courseId) {
  const { data } = await api.get(`/dashboard/${courseId}/leaderboard`);
  return data;
}
