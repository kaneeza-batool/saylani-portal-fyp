import api from './authService';

export async function fetchCampaigns({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/campaigns', { params: { search, status, page, limit } });
  return data;
}

export async function createCampaign(payload) {
  const { data } = await api.post('/admin/campaigns', payload);
  return data.item;
}

export async function updateCampaign(id, payload) {
  const { data } = await api.patch(`/admin/campaigns/${id}`, payload);
  return data.item;
}

export async function deleteCampaign(id) {
  await api.delete(`/admin/campaigns/${id}`);
}
