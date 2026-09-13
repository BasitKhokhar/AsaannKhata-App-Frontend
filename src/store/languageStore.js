import { useCallback } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '../i18n/en';
import { ur } from '../i18n/ur';
import { hi } from '../i18n/hi';

// Lightweight custom i18n — no i18next, this app's own flat key->string
// dictionaries (src/i18n/en|ur|hi.js) plus a Zustand store, mirroring
// themeStore's persist pattern exactly. `en` is the source of truth; any key
// missing from the active language falls back to English, then to the raw
// key itself, so a screen never renders `undefined`.
const dictionaries = { en, ur, hi };

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      lang: 'en', // 'en' | 'ur' | 'hi'
      setLang: (code) => set({ lang: dictionaries[code] ? code : 'en' }),
      t: (key) => {
        const { lang } = get();
        return dictionaries[lang]?.[key] || dictionaries.en[key] || key;
      },
    }),
    {
      name: 'asaankhata-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Imperative helpers for use outside React components (services, utils) —
// mirrors showToast()'s exported-function-alongside-the-store pattern in
// src/store/toastStore.js.
export const t = (key) => useLanguageStore.getState().t(key);
export const isUrdu = () => useLanguageStore.getState().lang === 'ur';

// Reactive hook for components — selects on `lang` (not on the store's own
// `t` method, whose reference never changes) so screens actually re-render
// when the language switches, then returns a `t(key)` closure over the
// current language.
export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  return useCallback((key) => dictionaries[lang]?.[key] || dictionaries.en[key] || key, [lang]);
}

// Urdu is the only RTL language here — Hindi stays LTR like English, per the
// per-screen manual flex/textAlign approach used on Dashboard/Settings/Auth/
// Onboarding (NOT React Native's global I18nManager.forceRTL(), which
// requires an app restart).
export const useIsUrdu = () => useLanguageStore((s) => s.lang === 'ur');
