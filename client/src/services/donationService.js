import api from './authService';

export async function fetchDonations({ search = '', status = 'all', campaign = 'all', page = 1, limit = 8 } = {}) {
  const { data } = await api.get('/admin/donations', { params: { search, status, campaign, page, limit } });
  return data;
}

export async function fetchDonation(id) {
  const { data } = await api.get(`/admin/donations/${id}`);
  return data.item;
}

export async function updateDonationStatus(id, status) {
  const { data } = await api.patch(`/admin/donations/${id}/status`, { status });
  return data.item;
}

export async function deleteDonation(id) {
  await api.delete(`/admin/donations/${id}`);
}

export async function fetchCampaignOptions() {
  const { data } = await api.get('/admin/donations/campaign-options');
  return data.items;
}

export async function fetchCampaignSummary() {
  const { data } = await api.get('/admin/donations/campaign-summary');
  return data.summary;
}
