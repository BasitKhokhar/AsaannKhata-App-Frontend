import { apiClient } from './apiClient';

// Axios wrapper for the backend's push-notification endpoints — mirrors the
// shape of adsApi/syncApi. Push registration is account-scoped and independent
// from shop-scoped sync-device entitlement limits.
export const notificationsApi = {
  registerToken: ({ installationId, fcmToken, deviceName, platform }) =>
    apiClient.post('/notifications/register-token', { installationId, fcmToken, deviceName, platform }).then((r) => r.data),
  removeToken: ({ installationId }) => apiClient.delete('/notifications/remove-token', { data: { installationId } }).then((r) => r.data),
  list: ({ page = 1, limit = 20 } = {}) => apiClient.get('/notifications', { params: { page, limit } }).then((r) => r.data),
  unreadCount: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.put('/notifications/mark-all-read').then((r) => r.data),
  createSupportRequest: (payload) => apiClient.post('/notifications/support-requests', payload).then((r) => r.data),
};
