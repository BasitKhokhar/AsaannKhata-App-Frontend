// Screens consume semantic colors through useTheme(). Palette changes never
// change layout, stock behavior, or the meaning of status colors.
export const palette = {
  navy900: '#151E33', navy800: '#22314F', navy700: '#2E4270',
  navy500: '#5B72A6', navy200: '#B3BEDB', gold700: '#9A7A22',
  gold600: '#C6982F', gold400: '#E0BB63', surface0: '#FAF9F6',
  surface1: '#F0EEE8', surface2: '#DEDAD0', ink600: '#6B7280',
  ink900: '#232733', success: '#2E9E6B', warning: '#C6982F',
  danger: '#C8493C', white: '#FFFFFF', black: '#000000',
};

export const DEFAULT_PRESET = 'emerald';

export const themePresets = {
  emerald: { label: 'Emerald', primary: '#07885C', deep: '#064B42', accent: '#12A66E', soft: '#E5F5ED' },
  ocean: { label: 'Ocean', primary: '#087E9B', deep: '#075169', accent: '#15A8B7', soft: '#E2F4F7' },
  indigo: { label: 'Indigo', primary: '#5658B9', deep: '#343773', accent: '#7775DA', soft: '#EEEEFC' },
  amber: { label: 'Amber', primary: '#AB6B0B', deep: '#71440A', accent: '#D58B13', soft: '#FFF2DC' },
  rose: { label: 'Rose', primary: '#B44870', deep: '#772C4B', accent: '#D76589', soft: '#FCEAF0' },
  slate: { label: 'Slate', primary: '#47647B', deep: '#273C50', accent: '#6A8BA1', soft: '#EAF1F5' },
  classic: { label: 'Classic', primary: palette.navy700, deep: palette.navy900, accent: palette.gold600, soft: '#F0EEE8' },
};

export function isThemePreset(key) {
  return Object.prototype.hasOwnProperty.call(themePresets, key);
}

// A shop's category suggests a starting color; an explicit user choice wins.
export function suggestedPresetForShopType(code) {
  if (!code) return DEFAULT_PRESET;
  if (/PHARMACY|MEDIC|MILK|DAIRY/.test(code)) return 'ocean';
  if (/HARDWARE|ELECTRIC|AUTO|PIPE|CABLE/.test(code)) return 'amber';
  if (/CLOTH|FABRIC|SALON|BEAUTY|FOOTWEAR/.test(code)) return 'rose';
  if (/MOBILE|ELECTRONIC|TECH/.test(code)) return 'indigo';
  if (/TILE|MARBLE|GLASS|ALUMINUM|PLYWOOD|WOOD/.test(code)) return 'slate';
  return DEFAULT_PRESET;
}

export function createTheme(presetKey = DEFAULT_PRESET, mode = 'light') {
  const preset = themePresets[presetKey] || themePresets[DEFAULT_PRESET];
  const dark = mode === 'dark';
  return {
    mode,
    brand: {
      primary: dark ? preset.accent : preset.primary,
      primaryDark: preset.deep,
      accent: preset.accent,
      accentDark: preset.deep,
      accentLight: dark ? preset.primary : preset.soft,
    },
    surface: {
      bg: dark ? '#111A1B' : '#FAFCFB',
      card: dark ? '#1B2829' : '#F2F7F5',
      raised: dark ? '#263536' : '#FFFFFF',
      border: dark ? '#354748' : '#E1E9E6',
      overlay: dark ? 'rgba(0,0,0,0.72)' : 'rgba(9,35,29,0.44)',
    },
    ink: {
      primary: dark ? '#F4F8F7' : '#10252A',
      secondary: dark ? '#AEBDBA' : '#61727A',
      inverse: '#FFFFFF', onBrand: '#FFFFFF',
    },
    semantic: {
      success: dark ? '#53C993' : '#07885C',
      warning: dark ? '#E6B86B' : '#B97717',
      danger: dark ? '#EF8D86' : '#D3413D',
      successBg: dark ? 'rgba(83,201,147,0.17)' : '#E5F5ED',
      warningBg: dark ? 'rgba(230,184,107,0.17)' : '#FFF2DE',
      dangerBg: dark ? 'rgba(239,141,134,0.17)' : '#FCEDEB',
    },
    gradient: {
      primary: [preset.primary, preset.accent],
      header: dark ? [preset.deep, '#112325'] : [preset.deep, preset.primary],
      accent: [preset.accent, preset.primary],
    },
  };
}

export const lightTheme = createTheme(DEFAULT_PRESET, 'light');
export const darkTheme = createTheme(DEFAULT_PRESET, 'dark');
export const onBrandAlpha = (alpha) => `rgba(255,255,255,${alpha})`;
