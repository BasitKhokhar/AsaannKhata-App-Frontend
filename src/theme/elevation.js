// Shadow/elevation scale. Light mode uses a warm, brand-tinted shadow color
// at low opacity ("premium = restraint" — a heavy grey drop-shadow reads as
// cheap). Dark mode relies on the surface luminance steps (bg/card/raised in
// colors.js) to communicate elevation, not shadows — shadows barely render
// against a dark background anyway, so levels stay near-zero and lean on
// `elevation` (Android) only where a little separation still helps.
const shadow = (color, { x = 0, y, opacity, radius, android }) => ({
  shadowColor: color,
  shadowOffset: { width: x, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: android,
});

const lightShadowColor = '#151E33';

export const elevation = {
  light: {
    none: shadow(lightShadowColor, { y: 0, opacity: 0, radius: 0, android: 0 }),
    xs: shadow(lightShadowColor, { y: 1, opacity: 0.04, radius: 3, android: 1 }),
    sm: shadow(lightShadowColor, { y: 2, opacity: 0.06, radius: 6, android: 2 }),
    md: shadow(lightShadowColor, { y: 4, opacity: 0.08, radius: 12, android: 4 }),
    lg: shadow(lightShadowColor, { y: 8, opacity: 0.1, radius: 20, android: 8 }),
    xl: shadow(lightShadowColor, { y: 14, opacity: 0.14, radius: 32, android: 14 }),
  },
  dark: {
    none: shadow('#000000', { y: 0, opacity: 0, radius: 0, android: 0 }),
    xs: shadow('#000000', { y: 1, opacity: 0.16, radius: 2, android: 1 }),
    sm: shadow('#000000', { y: 2, opacity: 0.2, radius: 4, android: 2 }),
    md: shadow('#000000', { y: 3, opacity: 0.24, radius: 8, android: 4 }),
    lg: shadow('#000000', { y: 6, opacity: 0.28, radius: 14, android: 8 }),
    xl: shadow('#000000', { y: 10, opacity: 0.32, radius: 22, android: 14 }),
  },
};
