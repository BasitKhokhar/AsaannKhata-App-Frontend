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
    raised: palette.white,
    border: palette.surface2,
    overlay: 'rgba(21,30,51,0.5)',
  },
  ink: {
    primary: palette.ink900,
    secondary: palette.ink600,
    inverse: palette.white,
    // Fixed near-white used for text/icons painted on the app's permanently
    // dark brand surfaces (header gradient, sidebar, splash, hero cards).
    // Unlike `inverse`, this never flips with theme mode — those surfaces
    // stay dark in both light and dark theme.
    onBrand: palette.surface0,
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

// Dark theme — a genuinely bespoke dark surface system, not the light
// palette with alpha-tint overlays. Three distinct luminance steps
// (bg < card < raised) so elevated content actually reads as elevated,
// desaturated/lower-contrast gradients (a saturated gold/navy gradient at
// full strength reads as glare at night), same brand/accent/semantic hues
// held constant so the app never feels like a "different brand" after dark.
export const darkTheme = {
  mode: 'dark',
  brand: {
    primary: palette.navy500,
    primaryDark: '#0B111F',
    accent: palette.gold400,
    accentDark: palette.gold600,
    accentLight: '#EAD08C',
  },
  surface: {
    bg: '#10162A',
    card: '#1B2338',
    raised: '#262F49',
    border: '#323C58',
    overlay: 'rgba(4,7,15,0.72)',
  },
  ink: {
    primary: '#F2F3F8',
    secondary: '#A2ABC4',
    inverse: palette.navy900,
    onBrand: palette.surface0,
  },
  semantic: {
    success: '#4CBE8B',
    warning: palette.gold400,
    danger: '#E07567',
    successBg: 'rgba(76,190,139,0.16)',
    warningBg: 'rgba(224,187,99,0.16)',
    dangerBg: 'rgba(224,117,103,0.16)',
  },
  gradient: {
    primary: ['#26345A', '#131B30'],
    header: ['#1D2740', '#0B111F'],
    accent: ['#B98F44', '#8F6B26'],
  },
};

// Alpha variant of `ink.onBrand`, for muted text/icons on the same
// permanently-dark brand surfaces (e.g. inactive sidebar labels, subtitle
// text on the splash screen). Stays constant across theme mode for the same
// reason `ink.onBrand` does.
export const onBrandAlpha = (alpha) => `rgba(250,249,246,${alpha})`;
