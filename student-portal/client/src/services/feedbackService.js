import api from './authService';

export async function submitFeedback(payload) {
  const { data } = await api.post('/feedback', payload);
  return data.feedback;
}

export async function getMyFeedback() {
  const { data } = await api.get('/feedback/mine');
  return data.feedback;
}
