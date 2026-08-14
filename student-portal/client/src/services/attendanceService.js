import api from './authService';

export async function getAttendanceSummary(courseId) {
  const { data } = await api.get(`/attendance/${courseId}/summary`);
  return data;
}

export async function getAttendanceByMonth(courseId, month) {
  const { data } = await api.get(`/attendance/${courseId}/monthly`, { params: month ? { month } : {} });
  return data;
}

export async function getAttendanceStreak(courseId) {
  const { data } = await api.get(`/attendance/${courseId}/streak`);
  return data;
}
