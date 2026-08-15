import api from './authService';

export async function getEnrolledCourses() {
  const { data } = await api.get('/courses');
  return data.courses;
}
