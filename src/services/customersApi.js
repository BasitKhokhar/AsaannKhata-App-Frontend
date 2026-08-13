import { apiClient } from './apiClient';

// New endpoints backing the khata/credit-ledger feature (see Backend
// routes/customerRoutes.js — added alongside this frontend build).
export const customersApi = {
  create: ({ name, phone, shopId }) => apiClient.post('/customers/add', { name, phone, shopId }).then((r) => r.data),
  list: (shopId) => apiClient.get('/customers/list', { params: { shopId } }).then((r) => r.data),
  getById: (id) => apiClient.get(`/customers/${id}`).then((r) => r.data),
  update: (id, { name, phone }) => apiClient.put(`/customers/update/${id}`, { name, phone }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/customers/delete/${id}`).then((r) => r.data),
  recordPayment: (id, { amount, note }) => apiClient.post(`/customers/${id}/payments`, { amount, note }).then((r) => r.data),
  listPayments: (id) => apiClient.get(`/customers/${id}/payments`).then((r) => r.data),
};
