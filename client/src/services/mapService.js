import api from './authService';

export async function fetchCampusMap() {
  const { data } = await api.get('/admin/map/campuses');
  return data;
}
