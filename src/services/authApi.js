import { apiClient } from './apiClient';

export const authApi = {
  register: (payload) => apiClient.post('/auth/admin/register', payload).then((r) => r.data),
  login: (payload) => apiClient.post('/auth/admin/login', payload).then((r) => r.data),
  refresh: (refreshToken) => apiClient.post('/auth/admin/refresh', { refreshToken }).then((r) => r.data),
  updatePassword: (payload) => apiClient.put('/auth/admin/update-password', payload).then((r) => r.data),
};
