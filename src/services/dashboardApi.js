import { apiClient } from './apiClient';

export const dashboardApi = {
  stats: ({ startDate, endDate, shopId } = {}) =>
    apiClient.get('/dashboard/stats', { params: { startDate, endDate, shopId } }).then((r) => r.data),

  salesTrend: ({ period = 'week', startDate, endDate, shopId } = {}) =>
    apiClient
      .get('/dashboard/analytics/sales-trend', { params: { period, startDate, endDate, shopId } })
      .then((r) => r.data),

  byProduct: ({ startDate, endDate, shopId, limit } = {}) =>
    apiClient
      .get('/dashboard/analytics/by-product', { params: { startDate, endDate, shopId, limit } })
      .then((r) => r.data),

  byCategory: ({ startDate, endDate, shopId } = {}) =>
    apiClient
      .get('/dashboard/analytics/by-category', { params: { startDate, endDate, shopId } })
      .then((r) => r.data),

  profitMarginTrend: ({ period = 'week', startDate, endDate, shopId } = {}) =>
    apiClient
      .get('/dashboard/analytics/profit-margin', { params: { period, startDate, endDate, shopId } })
      .then((r) => r.data),

  exportCsv: ({ report, period, startDate, endDate, shopId } = {}) =>
    apiClient
      .get('/dashboard/export', { params: { report, period, startDate, endDate, shopId }, responseType: 'text' })
      .then((r) => r.data),
};
