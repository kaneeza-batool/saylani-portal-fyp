import api from './authService';

export async function fetchStudents({ search = '', status = 'all', page = 1, limit = 10, roster } = {}) {
  const { data } = await api.get('/admin/students', { params: { search, status, page, limit, roster } });
  return data;
}

export async function createStudent(payload) {
  const { data } = await api.post('/admin/students', payload);
  return data.student;
}

export async function updateStudent(id, payload) {
  const { data } = await api.patch(`/admin/students/${id}`, payload);
  return data.student;
}

export async function deleteStudent(id) {
  await api.delete(`/admin/students/${id}`);
}
