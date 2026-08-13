// Font family names must match the keys returned by useFonts() in App.jsx
// (see @expo-google-fonts/outfit and @expo-google-fonts/ibm-plex-sans).
export const fontFamily = {
  headingMedium: 'Outfit_500Medium',
  headingSemiBold: 'Outfit_600SemiBold',
  headingBold: 'Outfit_700Bold',
  headingExtraBold: 'Outfit_800ExtraBold',

  bodyRegular: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemiBold: 'IBMPlexSans_600SemiBold',
  bodyBold: 'IBMPlexSans_700Bold',
};

// Type scale from the branding doc (size/lineHeight in px).
export const typeScale = {
  display: { fontFamily: fontFamily.headingBold, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: fontFamily.headingBold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fontFamily.headingSemiBold, fontSize: 20, lineHeight: 28 },
  h3: { fontFamily: fontFamily.headingSemiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.bodyRegular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.bodyRegular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, lineHeight: 16 },
  // Money / invoice numbers — tabular figures so columns of amounts align.
  numeric: { fontFamily: fontFamily.bodyMedium, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
  numericLarge: { fontFamily: fontFamily.headingBold, fontSize: 22, lineHeight: 28, fontVariant: ['tabular-nums'] },
};

// Font files to load with useFonts() — imported once in App.jsx.
export { Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
export {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
