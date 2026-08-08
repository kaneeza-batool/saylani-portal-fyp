import api from './authService';

export async function fetchAuditLogs({ search = '', action = 'all', resourceType = 'all', page = 1, limit = 15 } = {}) {
  const { data } = await api.get('/admin/audit-logs', { params: { search, action, resourceType, page, limit } });
  return data;
}
