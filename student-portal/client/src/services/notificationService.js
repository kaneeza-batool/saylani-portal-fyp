import api from './authService';

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}

export async function getAllNotifications() {
  const { data } = await api.get('/notifications/all');
  return data.notifications;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.notification;
}

export async function dismissNotification(id) {
  const { data } = await api.patch(`/notifications/${id}/dismiss`);
  return data.notification;
}
