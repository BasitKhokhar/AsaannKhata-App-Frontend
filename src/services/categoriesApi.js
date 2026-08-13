import { apiClient } from './apiClient';
import { toFormData, toImagePart } from './formData';

export const categoriesApi = {
  list: (shopId) => apiClient.get('/categories/get', { params: { shopId } }).then((r) => r.data),
  getById: (id) => apiClient.get(`/categories/get/${id}`).then((r) => r.data),
  create: ({ name, shopId, imageAsset }) =>
    apiClient
      .post('/categories/add', toFormData({ name, shopId, image: toImagePart(imageAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  update: (id, { name, imageAsset }) =>
    apiClient
      .put(`/categories/update/${id}`, toFormData({ name, image: toImagePart(imageAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  remove: (id) => apiClient.delete(`/categories/delete/${id}`).then((r) => r.data),
};
