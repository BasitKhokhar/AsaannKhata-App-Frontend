import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Which shop is "active" for an Admin who owns multiple shops — persisted so
// the app reopens on the same shop, validated against the live shop list on
// login (see authService) in case that shop was deleted elsewhere.
export const useShopStore = create(
  persist(
    (set) => ({
      activeShopId: null,
      setActiveShopId: (activeShopId) => set({ activeShopId }),
    }),
    {
      name: 'asaankhata-active-shop',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
