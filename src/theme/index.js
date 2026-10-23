import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, DEFAULT_PRESET, isThemePreset, palette, suggestedPresetForShopType, themePresets } from './colors';
import { fontFamily, typeScale } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { motion } from './motion';
import { elevation } from './elevation';
import { useThemeStore } from '../store/themeStore';
import { useShopStore } from '../store/shopStore';
import { useAuthStore } from '../store/authStore';
import { useShops } from '../hooks/useShops';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const mode = useThemeStore((s) => s.mode);
  const preset = useThemeStore((s) => s.preset);
  const shopPresets = useThemeStore((s) => s.shopPresets);
  const activeShopId = useShopStore((s) => s.activeShopId);
  const adminId = useAuthStore((s) => s.adminId);
  const { data: shops = [] } = useShops();
  const systemScheme = useColorScheme();

  const resolvedMode = mode === 'system' ? systemScheme ?? 'light' : mode;
  const scope = adminId && activeShopId ? `${adminId}:${activeShopId}` : null;
  const activeShop = shops.find((shop) => String(shop.id) === String(activeShopId));
  const suggestedPreset = suggestedPresetForShopType(activeShop?.shopTypeCode);
  const preferredPreset = (scope && shopPresets?.[scope]) || (activeShop ? suggestedPreset : preset);
  const resolvedPreset = isThemePreset(preferredPreset) ? preferredPreset : DEFAULT_PRESET;

  const value = useMemo(() => {
    const colors = createTheme(resolvedPreset, resolvedMode);
    return {
      mode: resolvedMode,
      preset: resolvedPreset,
      themePresets,
      colors,
      typography: typeScale,
      fontFamily,
      spacing,
      radii,
      motion,
      elevation: elevation[resolvedMode],
      palette,
    };
  }, [resolvedMode, resolvedPreset]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
