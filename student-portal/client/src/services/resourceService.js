import api from './authService';

export async function getResourceLibrary() {
  const { data } = await api.get('/resources');
  return data.resources;
}
