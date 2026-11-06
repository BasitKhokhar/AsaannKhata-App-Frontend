import { usePrinterStore } from '../store/printerStore';
import { printThermalDocument } from './thermalPrinter';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { buildReceiptHtml, receiptDimensions } from '../utils/receiptHtml';
import { receiptProfileRepository } from '../db/repositories/receiptProfileRepository';

const fontCache = new Map();
async function receiptFont(language) {
  if (language === 'en') return '';
  if (!fontCache.has(language)) {
    const module = language === 'ur'
      ? require('@expo-google-fonts/noto-naskh-arabic/400Regular/NotoNaskhArabic_400Regular.ttf')
      : require('@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf');
    fontCache.set(language, (async () => {
      const asset = await Asset.fromModule(module).downloadAsync();
      return `data:font/ttf;base64,${await new File(asset.localUri || asset.uri).base64()}`;
    })().catch((error) => { fontCache.delete(language); throw error; }));
  }
  return fontCache.get(language);
}
export async function receiptDocument(bill, options = {}) {
  const config = options.config || bill.receiptSnapshot || receiptProfileRepository.resolved(bill.shopId);
  const fontData = await receiptFont(config.language);
  return { html: buildReceiptHtml({ bill, ...options, config, fontData }), ...receiptDimensions(config) };
}
export async function printReceipt(bill, options) {
  if (usePrinterStore.getState().target) {
    return printThermalDocument((paper) => receiptDocument(bill, { ...options, config: { ...(options?.config || bill.receiptSnapshot || receiptProfileRepository.resolved(bill.shopId)), paper } }));
  }
  await Print.printAsync(await receiptDocument(bill, options));
}
export async function shareReceipt(bill, options) {
  if (!await Sharing.isAvailableAsync()) throw new Error('receipt.shareUnavailable');
  const { uri } = await Print.printToFileAsync(await receiptDocument(bill, options));
  // Keep the cache file available while the receiving app reads it. Android
  // may resolve the share promise before the recipient has opened the PDF.
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
}
