// Keep leading zeroes and case: scanner terminators are the only whitespace
// removed. EAN-13's leading zero is equivalent to UPC-A for retail lookup.
export function normalizeBarcode(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new Error('barcode.invalid');
  const code = value.trim();
  if (!code) return null;
  if (code.length > 128 || /[\x00-\x1f\x7f]/.test(code)) throw new Error('barcode.invalid');
  return /^0\d{12}$/.test(code) ? code.slice(1) : code;
}

export function barcodeFields(fields, existing = {}) {
  const barcode = normalizeBarcode(fields.barcode === undefined ? existing.barcode : fields.barcode);
  const looseBarcode = (fields.stockType || existing.stockType) === 'PACK'
    ? normalizeBarcode(fields.looseBarcode === undefined ? existing.looseBarcode : fields.looseBarcode) : null;
  if (barcode && barcode === looseBarcode) throw new Error('barcode.duplicate');
  return { barcode, looseBarcode };
}

export function productSearchTokens(value) {
  return (value.match(/[\p{L}\p{N}]+/gu) || []).slice(0, 8).map((token) => `"${token}"*`).join(' AND ');
}
