import api from './authService';

export async function getAdmissions({ page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/admissions', { params: { page, limit } });
  return data;
}

export async function approveAdmission(id) {
  const { data } = await api.patch(`/admin/admissions/${id}/approve`);
  return { student: data.student, batchAssignment: data.batchAssignment };
}

export async function rejectAdmission(id) {
  const { data } = await api.patch(`/admin/admissions/${id}/reject`);
  return data.student;
}
