import { apiClient } from './apiClient';

// Every pull/push call must carry X-Device-Id for a device already
// registered via registerDevice() — enforced by the backend's
// requireDeviceRegistered middleware.
export const syncApi = {
  registerDevice: ({ shopId, deviceId, deviceName, platform }) =>
    apiClient.post('/sync/devices/register', { deviceId, deviceName, platform }, { headers: { 'X-Shop-Id': String(shopId) } }).then((r) => r.data),
  status: () => apiClient.get('/sync/status').then((r) => r.data),
  pull: ({ shopId, since, deviceId }) =>
    apiClient.get('/sync/pull', { params: { since }, headers: { 'X-Shop-Id': String(shopId), 'X-Device-Id': deviceId } }).then((r) => r.data),
  pushCategories: (shopId, deviceId, operations) => push('/sync/push/categories', shopId, deviceId, operations),
  pushProducts: (shopId, deviceId, operations) => push('/sync/push/products', shopId, deviceId, operations),
  pushStockAdjustments: (shopId, deviceId, operations) => push('/sync/push/stock-adjustments', shopId, deviceId, operations),
  pushBills: (shopId, deviceId, operations) => push('/sync/push/bills', shopId, deviceId, operations),
  pushCustomers: (shopId, deviceId, operations) => push('/sync/push/customers', shopId, deviceId, operations),
  pushCustomerPayments: (shopId, deviceId, operations) => push('/sync/push/customer-payments', shopId, deviceId, operations),
  pushExpenses: (shopId, deviceId, operations) => push('/sync/push/expenses', shopId, deviceId, operations),
};

function push(path, shopId, deviceId, operations) {
  return apiClient.post(path, { operations }, { headers: { 'X-Shop-Id': String(shopId), 'X-Device-Id': deviceId } }).then((r) => r.data);
}
