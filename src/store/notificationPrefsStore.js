import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-app notification preferences ONLY — separate from the real push/FCM
// infrastructure in src/services/fcmService.js. These booleans are read by
// other screens (e.g. Dashboard's low-stock section) to decide whether to
// surface an in-app alert; they never trigger a system notification
// directly. Mirrors themeStore's persist pattern.
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
