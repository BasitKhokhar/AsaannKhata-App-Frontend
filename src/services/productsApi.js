import { apiClient } from './apiClient';
import { toFormData, toImagePart } from './formData';

export const productsApi = {
  list: ({ categoryId, page = 1, limit = 20 } = {}) =>
    apiClient.get('/products/getproducts', { params: { categoryId, page, limit } }).then((r) => r.data),
  getById: (id) => apiClient.get(`/products/getproduct/${id}`).then((r) => r.data),
  search: ({ q, shopId, page = 1, limit = 20 }) =>
    apiClient.get('/products/search', { params: { q, shopId, page, limit } }).then((r) => r.data),
  create: (fields) =>
    apiClient
      .post('/products/add', toFormData({ ...fields, image: toImagePart(fields.imageAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  update: (id, fields) =>
    apiClient
      .put(`/products/updateproduct/${id}`, toFormData({ ...fields, image: toImagePart(fields.imageAsset) }), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  remove: (id) => apiClient.delete(`/products/deleteproduct/${id}`).then((r) => r.data),
};
