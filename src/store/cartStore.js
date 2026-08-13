import { create } from 'zustand';

// In-progress POS cart — deliberately NOT persisted. A half-built bill is
// working memory for the current checkout, not app state to restore later.
export const useCartStore = create((set, get) => ({
  lines: [], // [{ productId, productName, stockType, quantity/area/length/pack fields, pricePerUnit, total, discount }]
  overallDiscount: 0,
  customerId: null,
  customerName: '',
  customerPhone: '',

  addLine: (line) => set({ lines: [...get().lines, line] }),
  updateLine: (index, patch) =>
    set({ lines: get().lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) }),
  removeLine: (index) => set({ lines: get().lines.filter((_, i) => i !== index) }),

  setCustomer: ({ customerId, customerName, customerPhone }) =>
    set({ customerId: customerId ?? null, customerName: customerName ?? '', customerPhone: customerPhone ?? '' }),

  setOverallDiscount: (overallDiscount) => set({ overallDiscount }),

  subtotal: () => get().lines.reduce((sum, l) => sum + (l.total || 0), 0),

  reset: () => set({ lines: [], overallDiscount: 0, customerId: null, customerName: '', customerPhone: '' }),
}));
