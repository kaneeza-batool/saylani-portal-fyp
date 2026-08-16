import api from './authService';

export async function fetchStudentFeedback({ type = 'all', status = 'all', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/student-feedback', { params: { type, status, page, limit } });
  return data;
}

export async function respondToStudentFeedback(id, payload) {
  const { data } = await api.patch(`/admin/student-feedback/${id}`, payload);
  return data.item;
}
