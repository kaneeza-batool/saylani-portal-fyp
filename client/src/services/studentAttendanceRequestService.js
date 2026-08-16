import api from './authService';

export async function fetchStudentAttendanceRequests({ status = 'all', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/student-attendance-requests', { params: { status, page, limit } });
  return data;
}

export async function resolveStudentAttendanceRequest(id, status) {
  const { data } = await api.patch(`/admin/student-attendance-requests/${id}`, { status });
  return data.item;
}
