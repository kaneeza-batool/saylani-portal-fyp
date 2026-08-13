import api from './authService';

export async function fetchStudentAttendance({ search = '', status = 'all', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/student-attendance', { params: { search, status, page, limit } });
  return data;
}

export async function lookupStudentByRollNumber(rollNumber) {
  const { data } = await api.get(`/admin/student-attendance/lookup/${rollNumber}`);
  return data;
}

export async function markStudentAttendance(payload) {
  const { data } = await api.post('/admin/student-attendance/mark', payload);
  return data.record;
}

export async function markMultipleAttendance(payload) {
  const { data } = await api.post('/admin/student-attendance/mark-multiple', payload);
  return data;
}

export async function getAttendanceSummary() {
  const { data } = await api.get('/admin/attendance/summary');
  return data;
}

export async function getAttendanceReports({ startDate, endDate, batch } = {}) {
  const { data } = await api.get('/admin/attendance/reports', { params: { startDate, endDate, batch } });
  return data;
}
