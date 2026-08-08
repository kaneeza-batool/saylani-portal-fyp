import api from './authService';

export async function fetchAttendanceRequests({ status = 'all', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/attendance-requests', { params: { status, page, limit } });
  return data;
}

export async function createAttendanceRequest(payload) {
  const { data } = await api.post('/admin/attendance-requests', payload);
  return data.item;
}

export async function resolveAttendanceRequest(id, status) {
  const { data } = await api.patch(`/admin/attendance-requests/${id}`, { status });
  return data.item;
}
