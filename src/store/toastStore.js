import { create } from 'zustand';

let idCounter = 0;

// Top-anchored toast queue. showToast() is imperative — call it from
// anywhere (screens, hooks, services) without prop-drilling a toast setter
// through every layer. Auto-dismiss duration scales with message length so
// short confirmations don't linger and long ones don't vanish unread.
export const useToastStore = create((set, get) => ({
  toast: null,
  showToast: (message, tone = 'neutral') => {
    const id = ++idCounter;
    set({ toast: { id, message, tone } });
    const duration = Math.min(6000, Math.max(2600, message.length * 60));
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, duration);
  },
  dismiss: () => set({ toast: null }),
}));

// tone: 'success' | 'warning' | 'danger' | 'neutral'
export const showToast = (message, tone) => useToastStore.getState().showToast(message, tone);
