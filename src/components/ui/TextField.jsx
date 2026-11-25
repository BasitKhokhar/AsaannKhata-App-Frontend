import React, { forwardRef, useContext, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';
import { KeyboardAwareContext } from './KeyboardAwareContext';

// `style` applies to the OUTER container (so callers can do style={{flex:1}}
// for side-by-side fields) — deliberately NOT spread onto the inner
// TextInput, which would silently clobber its own style array.
export const TextField = forwardRef(function TextField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, left, right, error, style, multiline, fieldHeight = multiline ? 84 : 48, floatingLabel = true, textAlign, onFocus, onBlur, accessibilityLabel, ...rest }, ref) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const keyboardAware = useContext(KeyboardAwareContext);
  const inputRef = useRef(null);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const isPassword = !!secureTextEntry;
  const hasLeft = !!left;
  const hasValue = String(value || '').length > 0;
  const floating = floatingLabel && (focused || hasValue);

  function handleFocus(event) {
    setFocused(true);
    keyboardAware?.focusInput(inputRef.current);
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
          minHeight: fieldHeight,
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
                left: textAlign === 'right' ? undefined : hasLeft ? spacing.md + 24 + spacing.sm : spacing.md,
                right: textAlign === 'right' ? hasLeft ? spacing.md + 24 + spacing.sm : spacing.md : undefined,
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
        {left}
        <TextInput
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          style={[typography.body, { flex: 1, color: colors.ink.primary, paddingVertical: multiline ? spacing.md : 0, textAlignVertical: multiline ? 'top' : 'center', opacity: rest.editable === false ? 0.55 : 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={floating ? placeholder : undefined}
          placeholderTextColor={colors.ink.secondary}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlign={textAlign}
          accessibilityLabel={accessibilityLabel || label}
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
});
