import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Connections are device-local, never synchronized to another phone.
export const usePrinterStore = create(persist((set) => ({
  target: null, // null = Android/iOS system print dialog
  paper: '80', widthDots: 576, cut: false, profiles: {}, busy: false,
  select: (target) => set((state) => ({ target, ...(state.profiles[target?.key] || { paper: '80', widthDots: 576, cut: false }) })),
  configure: (patch) => set((state) => {
    const next = { paper: state.paper, widthDots: state.widthDots, cut: state.cut, ...patch };
    return { ...next, profiles: state.target ? { ...state.profiles, [state.target.key]: next } : state.profiles };
  }),
}), {
  name: 'asaankhata-printers', storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ target, paper, widthDots, cut, profiles }) => ({ target, paper, widthDots, cut, profiles }),
}));
