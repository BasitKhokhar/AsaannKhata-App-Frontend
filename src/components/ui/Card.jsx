import React from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 14, stiffness: 260 };

// level: elevation token key ('none'|'xs'|'sm'|'md'|'lg'|'xl') — defaults to
// a subtle 'sm' shadow so every Card gets a touch of depth for free.
export function Card({ children, style, bordered = true, level = 'sm', onPress }) {
  const { colors, radii, spacing, elevation } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const baseStyle = [
    {
      backgroundColor: colors.surface.card,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: bordered ? 1 : 0,
      borderColor: colors.surface.border,
    },
    elevation[level] || elevation.sm,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        style={[animatedStyle, baseStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}
