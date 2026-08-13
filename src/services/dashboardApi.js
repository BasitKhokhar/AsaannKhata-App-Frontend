import { apiClient } from './apiClient';

export const dashboardApi = {
  stats: ({ startDate, endDate, shopId } = {}) =>
    apiClient.get('/dashboard/stats', { params: { startDate, endDate, shopId } }).then((r) => r.data),
};
