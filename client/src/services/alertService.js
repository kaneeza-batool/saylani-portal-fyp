import api from './authService';

export async function fetchAlerts({ status = 'active' } = {}) {
  const { data } = await api.get('/admin/alerts', { params: { status } });
  return data;
}

export async function resolveAlert(id) {
  const { data } = await api.patch(`/admin/alerts/${id}/resolve`);
  return data.item;
}
