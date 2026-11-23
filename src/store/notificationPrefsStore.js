import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Device-local alert preferences. lowStockAlerts controls both the in-app
// low-stock surface and the repeating offline local notifications. Backend
// FCM and the server inbox remain separate concerns.
export const useNotificationPrefsStore = create(
  persist(
    (set) => ({
      lowStockAlerts: true,
      syncStatusAlerts: true,
      khataDueReminders: true,
      setLowStockAlerts: (value) => set({ lowStockAlerts: value }),
      setSyncStatusAlerts: (value) => set({ syncStatusAlerts: value }),
      setKhataDueReminders: (value) => set({ khataDueReminders: value }),
    }),
    {
      name: 'asaankhata-notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
