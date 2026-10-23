import { apiClient } from './apiClient';

// Every pull/push call must carry X-Device-Id for a device already
// registered via registerDevice() — enforced by the backend's
// requireDeviceRegistered middleware.
export const syncApi = {
  registerDevice: ({ deviceId, deviceName, platform }) =>
    apiClient.post('/sync/devices/register', { deviceId, deviceName, platform }).then((r) => r.data),
  status: () => apiClient.get('/sync/status').then((r) => r.data),
  pull: ({ since, deviceId }) =>
    apiClient.get('/sync/pull', { params: { since }, headers: { 'X-Device-Id': deviceId } }).then((r) => r.data),
  pushCategories: (deviceId, operations) => push('/sync/push/categories', deviceId, operations),
  pushProducts: (deviceId, operations) => push('/sync/push/products', deviceId, operations),
  pushStockAdjustments: (deviceId, operations) => push('/sync/push/stock-adjustments', deviceId, operations),
  pushBills: (deviceId, operations) => push('/sync/push/bills', deviceId, operations),
  pushCustomers: (deviceId, operations) => push('/sync/push/customers', deviceId, operations),
  pushCustomerPayments: (deviceId, operations) => push('/sync/push/customer-payments', deviceId, operations),
  pushExpenses: (deviceId, operations) => push('/sync/push/expenses', deviceId, operations),
};

function push(path, deviceId, operations) {
  return apiClient.post(path, { operations }, { headers: { 'X-Device-Id': deviceId } }).then((r) => r.data);
}
