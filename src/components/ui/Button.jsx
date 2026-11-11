import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 14, stiffness: 260 };

// variant: 'primary' (navy gradient), 'accent' (gold gradient), 'outline', 'ghost', 'danger'
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon, compact = false }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isGradient = variant === 'primary' || variant === 'accent';
  const gradientColors = variant === 'accent' ? colors.gradient.accent : colors.gradient.primary;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(0.97, PRESS_SPRING);
  };
  const onPressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'accent'
              ? colors.ink.primary
              : variant === 'danger'
              ? colors.semantic.danger
              : colors.ink.inverse
          }
        />
      ) : (
        <>
          {icon}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={[
              compact ? typography.label : typography.h3,
              {
                color: textColorFor(variant, colors),
                marginLeft: icon ? spacing.sm : 0,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  const baseStyle = {
    height: compact ? 42 : 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: compact ? spacing.sm : spacing.xl,
    opacity: disabled ? 0.5 : 1,
  };

  if (isGradient) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[animatedStyle, style]}
      >
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseStyle}>
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const outlineStyle =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: colors.brand.primary, backgroundColor: 'transparent' }
      : variant === 'danger'
      ? { backgroundColor: colors.semantic.dangerBg }
      : { backgroundColor: 'transparent' };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[animatedStyle, baseStyle, outlineStyle, style]}
    >
      {content}
    </AnimatedPressable>
  );
}

function textColorFor(variant, colors) {
  switch (variant) {
    case 'primary':
      return colors.ink.inverse;
    case 'accent':
      return colors.ink.primary;
    case 'outline':
      return colors.brand.primary;
    case 'danger':
      return colors.semantic.danger;
    default:
      return colors.ink.secondary;
  }
}
