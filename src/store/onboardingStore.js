import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'asaankhata-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
