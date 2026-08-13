import axios from 'axios';
import { API_BASE_URL } from '../constants/apiConfig';
import { useAuthStore } from '../store/authStore';
import { useShopStore } from '../store/shopStore';
import * as secureSession from './secureSession';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Most shop-scoped endpoints accept X-Shop-Id as one of the places to read
  // shopId from (see backend tenantContext middleware) — set it here so
  // individual service calls don't have to repeat it, unless already provided.
  const { activeShopId } = useShopStore.getState();
  if (activeShopId && !config.headers['X-Shop-Id']) {
    config.headers['X-Shop-Id'] = String(activeShopId);
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token available');

  // axios.create() base instance would re-trigger interceptors recursively —
  // use a bare axios call for the refresh request itself.
  const { data } = await axios.post(`${API_BASE_URL}/auth/admin/refresh`, { refreshToken });
  useAuthStore.getState().setTokens(data);
  await secureSession.updateTokens(data);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newAccessToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().clearSession();
        await secureSession.clearSession();
        // Local SQLite data is deliberately untouched — offline-first means
        // logging back in as the same shop owner should see data instantly.
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
