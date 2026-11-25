import React, { useRef } from 'react';
import { ScanBarcode } from 'lucide-react-native';
import { useT } from '../../store/languageStore';
import { useTheme } from '../../theme';
import { TextField } from '../ui/TextField';

// HID scanners end a scan with Enter. This dedicated input never intercepts
// search/customer fields and does not update React state on every character.
export function ScannerInput({ onScan, keyboard = false }) {
  const ref = useRef(null);
  const { colors } = useTheme();
  const t = useT();
  return <TextField
    ref={ref}
    label={t('barcode.externalReady')}
    accessibilityLabel={t('barcode.externalReady')}
    left={<ScanBarcode size={20} color={colors.brand.primary} />}
    autoCapitalize="none"
    autoCorrect={false}
    maxLength={128}
    showSoftInputOnFocus={keyboard}
    submitBehavior="submit"
    onSubmitEditing={(event) => { const code = event.nativeEvent.text; ref.current?.clear(); if (code.trim()) onScan(code); }}
  />;
}
