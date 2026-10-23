import { create } from 'zustand';

// Ephemeral cross-step state for the 3-step registration wizard — not
// persisted, cleared on submit/unmount (same category of state as cartStore).
export const useRegisterStore = create((set) => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',

  shopName: '',
  shopAddress: '',
  shopPhone: '',
  shopTypeCode: '',
  logoAsset: null,

  planCode: 'FREE_TRIAL',
  agreedToTerms: false,

  setFields: (fields) => set(fields),
  reset: () =>
    set({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      shopName: '',
      shopAddress: '',
      shopPhone: '',
      shopTypeCode: '',
      logoAsset: null,
      planCode: 'FREE_TRIAL',
      agreedToTerms: false,
    }),
}));
