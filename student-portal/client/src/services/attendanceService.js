import api from './authService';

export async function getAttendanceSummary() {
  const { data } = await api.get('/attendance/summary');
  return data;
}

export async function getAttendanceByMonth(month) {
  const { data } = await api.get('/attendance/monthly', { params: month ? { month } : {} });
  return data;
}

export async function getAttendanceStreak() {
  const { data } = await api.get('/attendance/streak');
  return data;
}
