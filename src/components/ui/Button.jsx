import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

// variant: 'primary' (navy gradient), 'accent' (gold gradient), 'outline', 'ghost', 'danger'
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isGradient = variant === 'primary' || variant === 'accent';
  const gradientColors = variant === 'accent' ? colors.gradient.accent : colors.gradient.primary;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'accent' ? colors.ink.primary : colors.ink.inverse} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              typography.h3,
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
    height: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    opacity: disabled ? 0.5 : 1,
  };

  if (isGradient) {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={style}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={baseStyle}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const outlineStyle =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: colors.brand.primary, backgroundColor: 'transparent' }
      : variant === 'danger'
      ? { backgroundColor: colors.semantic.dangerBg }
      : { backgroundColor: 'transparent' };

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[baseStyle, outlineStyle, style]}>
      {content}
    </Pressable>
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
