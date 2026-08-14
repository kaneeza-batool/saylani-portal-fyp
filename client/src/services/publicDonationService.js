import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export async function fetchPublicCampaigns() {
  const { data } = await publicApi.get('/public/campaigns');
  return data.items;
}

export async function fetchPublicCampaign(id) {
  const { data } = await publicApi.get(`/public/campaigns/${id}`);
  return data.item;
}

export async function submitDonation(campaignId, payload) {
  const { data } = await publicApi.post(`/public/campaigns/${campaignId}/donate`, payload);
  return data.item;
}

export async function checkDonationStatus(email) {
  const { data } = await publicApi.post('/public/donations/status', { email });
  return data.items;
}

export async function fetchDonorWall() {
  const { data } = await publicApi.get('/public/donor-wall');
  return data.items;
}
