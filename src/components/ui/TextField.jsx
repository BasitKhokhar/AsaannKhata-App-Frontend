import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';

// `style` applies to the OUTER container (so callers can do style={{flex:1}}
// for side-by-side fields) — deliberately NOT spread onto the inner
// TextInput, which would silently clobber its own style array.
export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, right, error, style, multiline, floatingLabel = false, textAlign, onFocus, onBlur, ...rest }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const isPassword = !!secureTextEntry;
  const hasValue = String(value || '').length > 0;
  const floating = floatingLabel && (focused || hasValue);

  function handleFocus(event) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event) {
    setFocused(false);
    onBlur?.(event);
  }

  return (
    <View style={style}>
      <View
        style={{
          minHeight: multiline ? 84 : 48,
          position: 'relative',
          borderRadius: radii.md,
          borderWidth: floating ? 1.5 : 1,
          borderColor: error ? colors.semantic.danger : focused ? colors.brand.primary : colors.surface.border,
          backgroundColor: colors.surface.raised,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        {floatingLabel && label ? (
          <Text
            pointerEvents="none"
            style={[
              floating ? typography.caption : typography.body,
              {
                position: 'absolute',
                zIndex: 1,
                top: floating ? -spacing.xs : multiline ? spacing.md : 13,
                left: textAlign === 'right' ? undefined : floating ? spacing.md : spacing.md,
                right: textAlign === 'right' ? spacing.md : undefined,
                paddingHorizontal: floating ? spacing.xs : 0,
                color: focused ? colors.brand.primary : colors.ink.secondary,
                backgroundColor: floating ? colors.surface.raised : 'transparent',
                textAlign,
              },
            ]}
          >
            {label}
          </Text>
        ) : label ? <Text style={[typography.label, { color: colors.ink.primary, marginBottom: spacing.xs }]}>{label}</Text> : null}
        <TextInput
          style={[typography.body, { flex: 1, color: colors.ink.primary, paddingVertical: multiline ? spacing.md : 0, textAlignVertical: multiline ? 'top' : 'center' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={floatingLabel ? undefined : placeholder}
          placeholderTextColor={colors.ink.secondary}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlign={textAlign}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t(hidden ? 'common.showPassword' : 'common.hidePassword')}>
            {hidden ? <Eye size={18} color={colors.ink.secondary} /> : <EyeOff size={18} color={colors.ink.secondary} />}
          </Pressable>
        ) : (
          right
        )}
      </View>
      {error ? <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.xs }]}>{error}</Text> : null}
    </View>
  );
}
