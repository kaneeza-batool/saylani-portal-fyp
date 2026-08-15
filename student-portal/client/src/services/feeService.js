import api from './authService';

export async function getFeeHistory() {
  const { data } = await api.get('/fee/history');
  return data.vouchers;
}

export async function getFeeSummary() {
  const { data } = await api.get('/fee/summary');
  return data;
}
