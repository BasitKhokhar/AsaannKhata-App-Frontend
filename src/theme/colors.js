// Raw palette pulled directly from the AsaanKhata brand identity doc.
// Nothing outside this file should ever reference a hex value directly —
// screens/components consume `lightTheme`/`darkTheme` via useTheme().
export const palette = {
  navy900: '#151E33',
  navy800: '#22314F',
  navy700: '#2E4270',
  navy500: '#5B72A6',
  navy200: '#B3BEDB',

  gold700: '#9A7A22',
  gold600: '#C6982F',
  gold400: '#E0BB63',

  surface0: '#FAF9F6',
  surface1: '#F0EEE8',
  surface2: '#DEDAD0',

  ink600: '#6B7280',
  ink900: '#232733',

  success: '#2E9E6B',
  warning: '#C6982F',
  danger: '#C8493C',

  white: '#FFFFFF',
  black: '#000000',
};

// Light theme — matches the design's default surfaces exactly.
export const lightTheme = {
  mode: 'light',
  brand: {
    primary: palette.navy700,
    primaryDark: palette.navy900,
    accent: palette.gold600,
    accentDark: palette.gold700,
    accentLight: palette.gold400,
  },
  surface: {
    bg: palette.surface0,
    card: palette.surface1,
    border: palette.surface2,
    overlay: 'rgba(21,30,51,0.5)',
  },
  ink: {
    primary: palette.ink900,
    secondary: palette.ink600,
    inverse: palette.white,
  },
  semantic: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    successBg: 'rgba(46,158,107,0.15)',
    warningBg: 'rgba(198,152,47,0.15)',
    dangerBg: 'rgba(200,73,60,0.12)',
  },
  gradient: {
    primary: [palette.navy700, palette.navy900],
    header: [palette.navy800, '#0F1729'],
    accent: [palette.gold400, palette.gold600],
  },
};

// Dark theme — mirrors the branding doc's dark-mode preview: navy-900 bg,
// card surfaces one step lighter, near-white ink, same brand/accent/semantic
// colors held constant so the app never feels like a "different brand" at night.
export const darkTheme = {
  mode: 'dark',
  brand: {
    primary: palette.navy700,
    primaryDark: '#0F1729',
    accent: palette.gold600,
    accentDark: palette.gold700,
    accentLight: palette.gold400,
  },
  surface: {
    bg: '#151E33',
    card: '#202B45',
    border: '#2E3A57',
    overlay: 'rgba(0,0,0,0.6)',
  },
  ink: {
    primary: '#F5F6FA',
    secondary: '#AEB6CC',
    inverse: palette.navy900,
  },
  semantic: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    successBg: 'rgba(46,158,107,0.22)',
    warningBg: 'rgba(198,152,47,0.22)',
    dangerBg: 'rgba(200,73,60,0.22)',
  },
  gradient: {
    primary: [palette.navy700, palette.navy900],
    header: [palette.navy800, '#0F1729'],
    accent: [palette.gold400, palette.gold600],
  },
};
