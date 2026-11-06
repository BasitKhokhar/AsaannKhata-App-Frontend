import React, { useState } from 'react';
import { ScrollView, Text, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ScannerInput } from '../../components/barcode/ScannerInput';
import { BarcodeScanner } from '../../components/barcode/BarcodeScanner';
import { useScannerStore } from '../../store/scannerStore';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';

export default function ScannerSettings() {
  const { colors, spacing, typography } = useTheme();
  const t = useT();
  const { external, setExternal } = useScannerStore();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.surface.bg }}>
    <Header title={t('barcode.settings')} />
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[typography.bodyMedium, { flex: 1, color: colors.ink.primary }]}>{t('barcode.external')}</Text>
          <Switch accessibilityLabel={t('barcode.external')} value={external} onValueChange={setExternal} />
        </View>
        <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('barcode.setupHelp')}</Text>
      </Card>
      <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('barcode.test')}</Text>
      <ScannerInput onScan={setCode} />
      <Button title={t('barcode.scan')} onPress={() => setScanning(true)} />
      {code ? <Text selectable style={[typography.body, { color: colors.brand.primary }]}>{code}</Text> : null}
    </ScrollView>
    <BarcodeScanner visible={scanning} onClose={() => setScanning(false)} onScan={setCode} />
  </SafeAreaView>;
}
