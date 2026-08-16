import api from './authService';

export async function sendChatMessage(message, history) {
  const { data } = await api.post('/chat', { message, history });
  return data.reply;
}
