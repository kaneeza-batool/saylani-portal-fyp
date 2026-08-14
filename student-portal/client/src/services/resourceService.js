import api from './authService';

export async function getResourceLibrary(courseId) {
  const { data } = await api.get(`/resources/${courseId}`);
  return data.resources;
}
