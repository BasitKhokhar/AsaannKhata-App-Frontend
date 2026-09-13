import { apiClient } from './apiClient';

// Axios wrapper for the backend's push-notification endpoints — mirrors the
// shape of adsApi/syncApi. registerToken/removeToken are keyed by this
// device's stable deviceId (see src/db/repositories/deviceRepository.js),
// the same id already used for /sync/devices/register — the backend
// requires the device to be registered there first.
export const notificationsApi = {
  registerToken: ({ deviceId, fcmToken }) =>
    apiClient.post('/notifications/register-token', { deviceId, fcmToken }).then((r) => r.data),
  removeToken: ({ deviceId }) => apiClient.delete('/notifications/remove-token', { data: { deviceId } }).then((r) => r.data),
  list: ({ page = 1, limit = 20 } = {}) => apiClient.get('/notifications', { params: { page, limit } }).then((r) => r.data),
  unreadCount: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.put('/notifications/mark-all-read').then((r) => r.data),
};
