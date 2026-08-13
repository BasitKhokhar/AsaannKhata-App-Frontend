import { apiClient } from './apiClient';

export const stockApi = {
  adjust: (payload) => apiClient.post('/stock/', payload).then((r) => r.data),
  list: ({ productId, shopId } = {}) => apiClient.get('/stock/', { params: { productId, shopId } }).then((r) => r.data),
  productStockIn: ({ productId, startDate, endDate, shopId }) =>
    apiClient.get('/stock/product-stock-in', { params: { productId, startDate, endDate, type: 'IN', shopId } }).then((r) => r.data),
};
