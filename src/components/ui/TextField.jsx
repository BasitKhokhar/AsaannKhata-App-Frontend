import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';

// `style` applies to the OUTER container (so callers can do style={{flex:1}}
// for side-by-side fields) — deliberately NOT spread onto the inner
// TextInput, which would silently clobber its own style array.
export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, right, error, style, multiline, ...rest }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const isPassword = !!secureTextEntry;

  return (
    <View style={style}>
      {label ? <Text style={[typography.label, { color: colors.ink.primary, marginBottom: spacing.xs }]}>{label}</Text> : null}
      <View
        style={{
          minHeight: multiline ? 84 : 48,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: error ? colors.semantic.danger : colors.surface.border,
          backgroundColor: colors.surface.raised,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          style={[typography.body, { flex: 1, color: colors.ink.primary, paddingVertical: multiline ? spacing.md : 0, textAlignVertical: multiline ? 'top' : 'center' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink.secondary}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          multiline={multiline}
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
