import api from './authService';

export async function fetchTrainerAttendance({ search = '', page = 1, limit = 10 } = {}) {
  const { data } = await api.get('/admin/trainer-attendance', { params: { search, page, limit } });
  return data;
}

export async function lookupTrainerByEmployeeId(employeeId) {
  const { data } = await api.get(`/admin/trainer-attendance/lookup/${employeeId}`);
  return data;
}

export async function checkInTrainer(payload) {
  const { data } = await api.post('/admin/trainer-attendance/checkin', payload);
  return data.record;
}

export async function checkOutTrainer(payload) {
  const { data } = await api.post('/admin/trainer-attendance/checkout', payload);
  return data.record;
}
