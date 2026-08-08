import api from './authService';

export async function fetchQuizzes({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/quizzes', { params: { search, status, page, limit } });
  return data;
}

export async function createQuiz(payload) {
  const { data } = await api.post('/admin/quizzes', payload);
  return data.item;
}

export async function updateQuiz(id, payload) {
  const { data } = await api.patch(`/admin/quizzes/${id}`, payload);
  return data.item;
}

export async function deleteQuiz(id) {
  await api.delete(`/admin/quizzes/${id}`);
}
