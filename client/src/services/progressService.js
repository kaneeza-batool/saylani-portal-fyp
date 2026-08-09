import api from './authService';

export async function getProgress(courseId) {
  const { data } = await api.get(`/progress/${courseId}`);
  return data;
}
