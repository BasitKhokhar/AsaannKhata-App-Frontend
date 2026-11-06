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

  addLine: (line) => set({ lines: [...get().lines, line] }),
  addScannedLine: (line) => set((state) => {
    const index = state.lines.findIndex((item) => item.productId === line.productId && item.unit === line.unit && item.pricePerUnit === line.pricePerUnit);
    if (index < 0) return { lines: [...state.lines, line] };
    return { lines: state.lines.map((item, i) => i !== index ? item : {
      ...item,
      quantity: item.quantity + line.quantity,
      packQuantity: (item.packQuantity || 0) + (line.packQuantity || 0),
      looseQuantity: (item.looseQuantity || 0) + (line.looseQuantity || 0),
      total: Math.round((item.total + line.total) * 100) / 100,
    }) };
  }),
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
