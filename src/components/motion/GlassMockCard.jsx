import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

// Frosted "premium card" frame every onboarding mockup illustration sits in —
// real BlurView glass + a tinted fill/border + a soft colored glow shadow
// keyed to the slide's accent, so all 4 mockups read as one system.
export function GlassMockCard({ children, width, glowColor, padding, style }) {
  const { colors, radii, spacing, mode } = useTheme();
  const glow = glowColor || colors.brand.accent;

  return (
    <View
      style={[
        {
          width,
          borderRadius: radii.lg,
          shadowColor: glow,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 10,
        },
        style,
      ]}
    >
      <View style={{ borderRadius: radii.lg, overflow: 'hidden' }}>
        <BlurView intensity={30} tint={mode === 'dark' ? 'dark' : 'light'}>
          <View
            style={{
              backgroundColor: colors.surface.card + 'CC',
              borderWidth: 1,
              borderColor: colors.surface.border,
              padding: padding ?? spacing.md,
            }}
          >
            {children}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
