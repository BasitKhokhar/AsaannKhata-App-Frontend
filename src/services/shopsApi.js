import { apiClient } from './apiClient';
import { toFormData, toImagePart } from './formData';

export const shopsApi = {
  list: () => apiClient.get('/shops/all').then((r) => r.data),
  getById: (id) => apiClient.get(`/shops/${id}`).then((r) => r.data),
  create: ({ name, address, phone, shopTypeCode, logoAsset }) =>
    apiClient
      .post('/shops/add', toFormData({ name, address, phone, shopTypeCode, logo: toImagePart(logoAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  update: (id, { name, address, phone, logoAsset }) =>
    apiClient
      .put(`/shops/update/${id}`, toFormData({ name, address, phone, logo: toImagePart(logoAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  remove: (id) => apiClient.delete(`/shops/delete/${id}`).then((r) => r.data),
};
