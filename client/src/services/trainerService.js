import api from './authService';

export async function fetchTrainers({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/trainers', { params: { search, status, page, limit } });
  return data;
}

// Returns both the new profile and its one-time-only login credentials
// (see server/controllers/trainerCreateController.js) — the caller is
// responsible for showing `credentials` to the admin exactly once.
export async function createTrainer(payload) {
  const { data } = await api.post('/admin/trainers', payload);
  return data;
}

export async function updateTrainer(id, payload) {
  const { data } = await api.patch(`/admin/trainers/${id}`, payload);
  return data.item;
}

export async function deleteTrainer(id) {
  await api.delete(`/admin/trainers/${id}`);
}

export async function updateTrainerStatus(id, status) {
  const { data } = await api.patch(`/admin/trainers/${id}/status`, { status });
  return data.trainer;
}

export async function resetTrainerPassword(id) {
  const { data } = await api.patch(`/admin/trainers/${id}/reset-password`, {});
  return data;
}
