import api from './authService';

export async function fetchReportSummary() {
  const { data } = await api.get('/admin/reports/summary');
  return data;
}
