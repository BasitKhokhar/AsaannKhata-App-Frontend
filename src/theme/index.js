import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, palette } from './colors';
import { fontFamily, typeScale } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { motion } from './motion';
import { elevation } from './elevation';
import { useThemeStore } from '../store/themeStore';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const resolvedMode = mode === 'system' ? systemScheme ?? 'light' : mode;

  const value = useMemo(() => {
    const colors = resolvedMode === 'dark' ? darkTheme : lightTheme;
    return {
      mode: resolvedMode,
      colors,
      typography: typeScale,
      fontFamily,
      spacing,
      radii,
      motion,
      elevation: elevation[resolvedMode],
      palette,
    };
  }, [resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
