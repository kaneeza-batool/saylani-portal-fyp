import api from './authService';

export async function fetchAuditLogs({
  search = '',
  action = 'all',
  resourceType = 'all',
  startDate,
  endDate,
  page = 1,
  limit = 15,
} = {}) {
  const { data } = await api.get('/admin/audit-logs', {
    params: { search, action, resourceType, startDate, endDate, page, limit },
  });
  return data;
}
