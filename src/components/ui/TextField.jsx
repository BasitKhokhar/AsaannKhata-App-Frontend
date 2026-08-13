import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../theme';

// `style` applies to the OUTER container (so callers can do style={{flex:1}}
// for side-by-side fields) — deliberately NOT spread onto the inner
// TextInput, which would silently clobber its own style array.
export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, right, error, style, ...rest }) {
  const { colors, radii, typography, spacing } = useTheme();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const isPassword = !!secureTextEntry;

  return (
    <View style={style}>
      {label ? <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.xs }]}>{label}</Text> : null}
      <View
        style={{
          height: 48,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: error ? colors.semantic.danger : colors.surface.border,
          backgroundColor: colors.surface.bg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          style={[typography.body, { flex: 1, color: colors.ink.primary, paddingVertical: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink.secondary}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Text style={[typography.label, { color: colors.ink.secondary }]}>{hidden ? 'SHOW' : 'HIDE'}</Text>
          </Pressable>
        ) : (
          right
        )}
      </View>
      {error ? <Text style={[typography.caption, { color: colors.semantic.danger, marginTop: spacing.xs }]}>{error}</Text> : null}
    </View>
  );
}
