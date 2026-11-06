import React, { useRef, useState } from 'react';
import { AppState, Linking, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';
import { normalizeBarcode } from '../../utils/barcodes';

export function BarcodeScanner({ visible, onClose, onScan }) {
  return visible ? <Scanner onClose={onClose} onScan={onScan} /> : null;
}

function Scanner({ onClose, onScan }) {
  const { colors, spacing, typography } = useTheme();
  const t = useT();
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [torch, setTorch] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(AppState.currentState === 'active');
  const consumed = useRef(false);
  React.useEffect(() => { const sub = AppState.addEventListener('change', (state) => setActive(state === 'active')); return () => sub.remove(); }, []);
  function submit(value) {
    if (consumed.current) return;
    try {
      const code = normalizeBarcode(value);
      if (!code) return;
      consumed.current = true; // Close after one scan: camera frames cannot duplicate a sale.
      onClose();
      onScan(code);
    } catch (cause) { consumed.current = false; setError(t(cause.message || 'barcode.invalid')); }
  }
  return <Modal animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.bg, padding: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.h2, { color: colors.ink.primary }]}>{t('barcode.scan')}</Text>
      {permission?.granted && focused && active ? <CameraView style={{ flex: 1 }} facing="back" enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14', 'qr'] }}
        onBarcodeScanned={({ data }) => submit(data)} onMountError={() => setError(t('barcode.cameraError'))} />
        : <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md }}>
          <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('barcode.permission')}</Text>
          <Button title={t('barcode.enableCamera')} onPress={() => permission?.canAskAgain === false ? Linking.openSettings() : requestPermission()} />
        </View>}
      <TextField label={t('barcode.manual')} value={manual} onChangeText={setManual} autoCapitalize="none" autoCorrect={false} maxLength={128} onSubmitEditing={() => submit(manual)} />
      {error ? <Text style={{ color: colors.semantic.danger }}>{error}</Text> : null}
      <Button title={t('barcode.useCode')} onPress={() => submit(manual)} disabled={!manual.trim()} />
      {permission?.granted ? <Button title={t('barcode.torch')} variant="outline" onPress={() => setTorch(!torch)} /> : null}
      <Button title={t('common.cancel')} variant="ghost" onPress={onClose} />
    </SafeAreaView>
  </Modal>;
}
