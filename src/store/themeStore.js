import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// mode: 'system' | 'light' | 'dark'. 'system' means follow the OS live via
// useColorScheme() inside theme/index.js — this store only holds the user's
// explicit override, persisted across launches.
export const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'asaankhata-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
