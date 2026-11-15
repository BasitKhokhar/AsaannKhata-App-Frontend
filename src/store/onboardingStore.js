import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      authEntryRoute: null,
      completeOnboarding: () =>
        set({ hasSeenOnboarding: true, authEntryRoute: 'RegisterStep1' }),
      consumeAuthEntryRoute: () => set({ authEntryRoute: null }),
    }),
    {
      name: 'asaankhata-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // The registration handoff is intentionally session-only. Once a new
      // user has reached auth, later app launches should open Login.
      partialize: (state) => ({ hasSeenOnboarding: state.hasSeenOnboarding }),
    }
  )
);
