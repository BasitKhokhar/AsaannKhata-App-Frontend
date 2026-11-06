import { apiClient } from '../services/apiClient';
import { receiptProfileRepository } from '../db/repositories/receiptProfileRepository';

export async function syncReceiptProfile(shopId, deviceId) {
  const headers = { 'X-Shop-Id': String(shopId), 'X-Device-Id': deviceId };
  // Capability check prevents an older backend silently discarding new fields.
  const { data } = await apiClient.get('/sync/receipt-profile', { headers });
  if (data.barcodeReceiptsVersion !== 1) throw new Error('Barcode and receipt sync requires the updated backend');
  const local = receiptProfileRepository.get(shopId);
  if (local?.syncStatus === 'conflict') return { conflict: true };
  if (local?.syncStatus === 'pending') {
    if ((data.profile?.version || 0) !== local.version) { receiptProfileRepository.markConflict(shopId); return { conflict: true }; }
    let response;
    try { response = await apiClient.put('/sync/receipt-profile', { config: local.config, version: local.version }, { headers }); }
    catch (error) { if (error.response?.status === 409) { receiptProfileRepository.markConflict(shopId); return { conflict: true }; } throw error; }
    receiptProfileRepository.accept(shopId, response.data.profile, local.updatedAt);
  } else if (data.profile) {
    receiptProfileRepository.accept(shopId, data.profile);
  }
}

export async function resolveReceiptConflict(shopId, deviceId, keepLocal) {
  const headers = { 'X-Shop-Id': String(shopId), 'X-Device-Id': deviceId };
  const { data } = await apiClient.get('/sync/receipt-profile', { headers });
  if (keepLocal) receiptProfileRepository.rebase(shopId, data.profile?.version || 0);
  else if (data.profile) receiptProfileRepository.accept(shopId, data.profile, receiptProfileRepository.get(shopId)?.updatedAt);
}
