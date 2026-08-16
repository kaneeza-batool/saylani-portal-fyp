import api from './authService';

export async function fetchMyAttendanceRequests() {
  const { data } = await api.get('/attendance-requests');
  return data.items;
}

export async function createAttendanceRequest(payload) {
  const { data } = await api.post('/attendance-requests', payload);
  return data.item;
}

export async function selfMarkAttendance() {
  const { data } = await api.post('/attendance-requests/self-mark');
  return data.record;
}
