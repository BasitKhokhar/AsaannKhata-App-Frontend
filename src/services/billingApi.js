import { apiClient } from './apiClient';

export const billingApi = {
  create: (payload) => apiClient.post('/billing/create', payload).then((r) => r.data),
  list: ({ status = 'all', startDate, endDate, page = 1, limit = 20, shopId } = {}) =>
    apiClient.get('/billing/getallbills', { params: { status, startDate, endDate, page, limit, shopId } }).then((r) => r.data),
  getById: (id) => apiClient.get(`/billing/${id}`).then((r) => r.data),
  // payload may include NewRecivedPyament to add a payment against remainingDue.
  update: (id, payload) => apiClient.put(`/billing/update/${id}`, payload).then((r) => r.data),
};
