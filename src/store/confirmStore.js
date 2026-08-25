import { create } from 'zustand';

// Imperative confirm-dialog state. showConfirm() resolves true/false based
// on which button the user taps — call sites just `await showConfirm(...)`,
// they never render a dialog themselves (see ConfirmDialog.jsx, mounted
// once near the app root).
export const useConfirmStore = create((set, get) => ({
  request: null, // { title, message, confirmLabel, cancelLabel, isUrgent, resolve }
  open: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', isUrgent = false }) =>
    new Promise((resolve) => {
      set({ request: { title, message, confirmLabel, cancelLabel, isUrgent, resolve } });
    }),
  resolve: (value) => {
    const { request } = get();
    request?.resolve(value);
    set({ request: null });
  },
}));

export const showConfirm = (args) => useConfirmStore.getState().open(args);
