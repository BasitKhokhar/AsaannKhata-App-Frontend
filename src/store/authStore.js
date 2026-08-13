import { create } from 'zustand';

// In-memory session state. Tokens are the durable copy in SecureStore
// (src/services/secureSession.js) — this store is the fast, synchronous
// read path everything else in the app (apiClient, navigation gating) uses.
export const useAuthStore = create((set, get) => ({
  isHydrated: false, // true once App.jsx has attempted to load a saved session
  accessToken: null,
  refreshToken: null,
  adminId: null,
  email: null,
  name: null,

  isAuthenticated: () => !!get().accessToken,

  setSession: (session) =>
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      adminId: session.adminId,
      email: session.email ?? null,
      name: session.name ?? null,
    }),

  setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),

  clearSession: () =>
    set({ accessToken: null, refreshToken: null, adminId: null, email: null, name: null }),

  setHydrated: (isHydrated) => set({ isHydrated }),
}));
