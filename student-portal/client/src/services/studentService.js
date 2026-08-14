import api from './authService';

export async function getProfile() {
  const { data } = await api.get('/student/profile');
  return data.student;
}

export async function updateProfile(fields) {
  const { data } = await api.put('/student/profile', fields);
  return data.student;
}

export async function uploadAvatar(imageBase64) {
  const { data } = await api.post('/student/avatar', { imageBase64 });
  return data.student;
}
