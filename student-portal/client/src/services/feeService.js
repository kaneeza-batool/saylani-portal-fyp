import api from './authService';

export async function getFeeHistory(courseId) {
  const { data } = await api.get(`/fee/${courseId}/history`);
  return data.vouchers;
}

export async function getFeeSummary(courseId) {
  const { data } = await api.get(`/fee/${courseId}/summary`);
  return data;
}
