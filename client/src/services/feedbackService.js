import api from './authService';

export async function fetchFeedback({ trainer, rating = 'all', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/feedback', { params: { trainer, rating, page, limit } });
  return data;
}
