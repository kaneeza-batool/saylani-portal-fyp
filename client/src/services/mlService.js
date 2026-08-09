import api from './authService';

export async function fetchDropoutRisk() {
  const { data } = await api.get('/admin/ml/dropout-risk');
  return data;
}
