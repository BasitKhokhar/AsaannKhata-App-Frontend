import { apiClient } from './apiClient';

export const shopTypesApi = {
  // Public endpoint — active list only, used by the registration shop-type picker.
  list: () => apiClient.get('/shop-types').then((r) => r.data),
};
