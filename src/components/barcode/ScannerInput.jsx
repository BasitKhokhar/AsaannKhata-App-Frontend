import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import { ScanBarcode } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';

// HID scanners end a scan with Enter. This dedicated input never intercepts
// search/customer fields and does not update React state on every character.
export function ScannerInput({ onScan, keyboard = false }) {
  const ref = useRef(null);
  const { colors, spacing, radii, typography } = useTheme();
  const t = useT();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md }}>
    <ScanBarcode size={20} color={colors.brand.primary} />
    <TextInput ref={ref} style={[typography.body, { flex: 1, height: 46, color: colors.ink.primary }]}
      placeholder={t('barcode.externalReady')} placeholderTextColor={colors.ink.secondary} accessibilityLabel={t('barcode.externalReady')}
      autoCapitalize="none" autoCorrect={false} maxLength={128} showSoftInputOnFocus={keyboard} submitBehavior="submit"
      onSubmitEditing={(event) => { const code = event.nativeEvent.text; ref.current?.clear(); if (code.trim()) onScan(code); }} />
  </View>;
}
