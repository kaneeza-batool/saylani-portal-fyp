import api from './authService';

export async function fetchSlots({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/slots', { params: { search, status, page, limit } });
  return data;
}

export async function createSlot(payload) {
  const { data } = await api.post('/admin/slots', payload);
  return data.item;
}

export async function updateSlot(id, payload) {
  const { data } = await api.patch(`/admin/slots/${id}`, payload);
  return data.item;
}

export async function deleteSlot(id) {
  await api.delete(`/admin/slots/${id}`);
}
