import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRESET, isThemePreset } from '../theme/colors';

// mode: 'system' | 'light' | 'dark'. 'system' means follow the OS live via
// useColorScheme() inside theme/index.js — this store only holds the user's
// explicit override, persisted across launches.
export const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'system',
      preset: DEFAULT_PRESET,
      shopPresets: {},
      setMode: (mode) => set({ mode: ['system', 'light', 'dark'].includes(mode) ? mode : 'system' }),
      setPreset: (preset, scope) => set((state) => {
        if (!isThemePreset(preset)) return state;
        if (!scope) return { preset };
        return { shopPresets: { ...state.shopPresets, [scope]: preset } };
      }),
      clearPreset: (scope) => set((state) => {
        if (!scope) return { preset: DEFAULT_PRESET };
        const shopPresets = { ...state.shopPresets };
        delete shopPresets[scope];
        return { shopPresets };
      }),
    }),
    {
      name: 'asaankhata-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
