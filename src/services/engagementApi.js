import { apiClient } from './apiClient';

export async function getHomePopup() {
  const { data } = await apiClient.get('/engagement/home-popup', {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data?.popup || null;
}
