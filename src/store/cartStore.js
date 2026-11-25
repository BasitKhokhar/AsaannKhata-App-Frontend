import { create } from 'zustand';

// In-progress POS cart — deliberately NOT persisted. A half-built bill is
// working memory for the current checkout, not app state to restore later.
export const useCartStore = create((set, get) => ({
  shopId: null,
  bindShop: (shopId) => { if (get().shopId !== shopId) { get().reset(); set({ shopId }); } },
  lines: [], // [{ productId, productName, stockType, quantity/area/length/pack fields, pricePerUnit, total, discount }]
  overallDiscount: 0,
  discountType: 'fixed',
  taxPercent: 0,
  customerId: null,
  customerName: '',
  customerPhone: '',

  addLine: (line) => set((state) => mergeCartLine(state.lines, line)),
  addScannedLine: (line) => set((state) => mergeCartLine(state.lines, line)),
  updateLine: (index, patch) =>
    set({ lines: get().lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) }),
  removeLine: (index) => set({ lines: get().lines.filter((_, i) => i !== index) }),

  setCustomer: ({ customerId, customerName, customerPhone }) =>
    set({ customerId: customerId ?? null, customerName: customerName ?? '', customerPhone: customerPhone ?? '' }),

  setOverallDiscount: (overallDiscount) => set({ overallDiscount }),
  setDiscountType: (discountType) => set({ discountType }),
  setTaxPercent: (taxPercent) => set({ taxPercent }),

  subtotal: () => get().lines.reduce((sum, l) => sum + (l.total || 0), 0),

  reset: () => set({ lines: [], overallDiscount: 0, discountType: 'fixed', taxPercent: 0, customerId: null, customerName: '', customerPhone: '' }),
}));

function mergeCartLine(lines, line) {
  const index = lines.findIndex((item) => canMergeLines(item, line));
  if (index < 0) return { lines: [...lines, line] };
  return {
    lines: lines.map((item, i) => i === index ? {
      ...item,
      quantity: (item.quantity || 0) + (line.quantity || 0),
      packQuantity: (item.packQuantity || 0) + (line.packQuantity || 0),
      looseQuantity: (item.looseQuantity || 0) + (line.looseQuantity || 0),
      totalArea: (item.totalArea || 0) + (line.totalArea || 0),
      lengthCm: (item.lengthCm || 0) + (line.lengthCm || 0),
      volumeMl: (item.volumeMl || 0) + (line.volumeMl || 0),
      total: Math.round(((item.total || 0) + (line.total || 0)) * 100) / 100,
    } : item),
  };
}

function canMergeLines(first, second) {
  if (first.productId !== second.productId || first.stockType !== second.stockType || first.unit !== second.unit || first.pricePerUnit !== second.pricePerUnit) return false;
  if (first.stockType === 'AREA') {
    return first.width === second.width && first.height === second.height && first.unitArea === second.unitArea;
  }
  return true;
}
