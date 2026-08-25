import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 14, stiffness: 260 };

// Icon-only tap target (header back buttons, row actions) with a spring
// press-scale (0.94) — every bare icon button in the app should render
// through this rather than a plain Pressable+Icon pair.
export function IconButton({ icon: Icon, onPress, size = 20, color, tone = 'default', disabled, style, hitSlop = 8 }) {
  const { colors, radii } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const resolvedColor = color || (tone === 'danger' ? colors.semantic.danger : colors.ink.primary);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        scale.value = withSpring(0.94, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      style={[
        animatedStyle,
        {
          width: 40,
          height: 40,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon size={size} color={resolvedColor} strokeWidth={1.8} />
    </AnimatedPressable>
  );
}
