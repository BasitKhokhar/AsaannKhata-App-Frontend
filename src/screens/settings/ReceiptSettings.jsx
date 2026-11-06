import { resolveReceiptConflict } from '../../sync/receiptProfiles';
import { deviceRepository } from '../../db/repositories/deviceRepository';
import React, { useEffect, useMemo, useState } from 'react';
import { WebView } from 'react-native-webview';
import { receiptDocument } from '../../services/receipts';
import { Image, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Header } from '../../components/ui/Header';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Card } from '../../components/ui/Card';
import { ReceiptActions } from '../../components/ui/ReceiptActions';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { useTheme } from '../../theme';
import { useT, useLanguageStore } from '../../store/languageStore';
import { useShopStore } from '../../store/shopStore';
import { receiptProfileRepository } from '../../db/repositories/receiptProfileRepository';
import { shopRepository } from '../../db/repositories/shopRepository';
import { normalizeReceiptConfig } from '../../utils/receiptConfig';
import { compressProductImage } from '../../services/productImages';
import { showToast } from '../../store/toastStore';

export default function ReceiptSettings() {
  const shopId = useShopStore((s) => s.activeShopId);
  return <Editor key={shopId || 'none'} shopId={shopId} />;
}
function Editor({ shopId }) {
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(() => receiptProfileRepository.resolved(shopId));
  const { data: profile } = useQuery({ queryKey: ['receiptProfile', shopId], queryFn: () => receiptProfileRepository.get(shopId) || null, enabled: !!shopId });
  const [busy, setBusy] = useState(false);
  const patch = (key, value) => setConfig((state) => ({ ...state, [key]: value }));
  const sample = useMemo(() => ({ id: 'SAMPLE', shopId, createdAt: new Date().toISOString(), customerName: t('receipt.sampleCustomer'), subtotal: 1500, discount: 100, totalAmount: 1400, totalReceived: 1400, remainingDue: 0, status: 'PAID', paymentMethod: 'CASH', items: [
    { productName: t('receipt.sampleItem'), stockType: 'QUANTITY', quantity: 2, pricePerUnit: 500, total: 1000 },
    { productName: t('receipt.sampleItem2'), stockType: 'QUANTITY', quantity: 1, pricePerUnit: 500, total: 500 },
  ] }), [shopId, t]);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { receiptDocument(sample, { config }).then(({ html }) => { if (!cancelled) setPreview(html); }).catch(() => { if (!cancelled) setPreview(''); }); }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sample, config]);
  async function logo() {
    setBusy(true);
    let uri;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
      if (result.canceled) return;
      uri = await compressProductImage(result.assets[0].uri);
      patch('logoData', `data:image/jpeg;base64,${await new File(uri).base64()}`);
    } catch { showToast(t('receipt.failed'), 'error'); }
    finally { if (uri) { const file = new File(uri); if (file.exists) file.delete(); } setBusy(false); }
  }
  async function resolve(keepLocal) {
    setBusy(true);
    try {
      if (keepLocal) receiptProfileRepository.save(shopId, config);
      await resolveReceiptConflict(shopId, deviceRepository.getOrCreate().deviceId, keepLocal);
      setConfig(receiptProfileRepository.resolved(shopId));
      queryClient.invalidateQueries({ queryKey: ['receiptProfile', shopId] });
      showToast(t('receipt.saved'), 'success');
    } catch { showToast(t('receipt.failed'), 'error'); }
    finally { setBusy(false); }
  }
  function save() {
    try { receiptProfileRepository.save(shopId, config); queryClient.invalidateQueries({ queryKey: ['receiptProfile', shopId] }); showToast(t('receipt.saved'), 'success'); }
    catch (error) { showToast(t(error.message?.startsWith('receipt.') ? error.message : 'receipt.failed'), 'error'); }
  }
  function reset() {
    const shop = shopRepository.getById(shopId);
    setConfig(normalizeReceiptConfig({ displayName: shop?.name, address: shop?.address, phone: shop?.phone, language: useLanguageStore.getState().lang }));
  }
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.surface.bg }}>
    <Header title={t('receipt.settings')} />
    <KeyboardAwareView>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[typography.body, { color: colors.ink.secondary }]}>{t('receipt.settingsHint')}</Text>
        {profile?.syncStatus === 'conflict' ? <Card style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.semantic.warning }}>{t('receipt.conflict')}</Text>
          <Button title={t('receipt.keepLocal')} onPress={() => resolve(true)} disabled={busy} />
          <Button title={t('receipt.useCloud')} variant="outline" onPress={() => resolve(false)} disabled={busy} />
        </Card> : null}
        <Card style={{ gap: spacing.md }}>
          {config.logoData ? <Image source={{ uri: config.logoData }} style={{ width: 72, height: 72, alignSelf: 'center' }} resizeMode="contain" /> : null}
          <Button title={t('receipt.logo')} variant="outline" onPress={logo} loading={busy} />
          {config.logoData ? <Button title={t('receipt.removeLogo')} variant="ghost" onPress={() => patch('logoData', '')} /> : null}
          {['displayName', 'address', 'phone', 'footer'].map((key) => <TextField key={key} label={t(`receipt.${key}`)} value={config[key]} onChangeText={(value) => patch(key, value)} maxLength={key === 'footer' ? 500 : 200} multiline={key === 'footer'} />)}
        </Card>
        <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('receipt.paper')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{['50', '55', '58', '80', 'A4'].map((paper) => <Chip key={paper} label={paper === 'A4' ? 'A4' : `${paper} mm`} selected={config.paper === paper} onPress={() => patch('paper', paper)} />)}</View>
        <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('receipt.language')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{[['en', 'English'], ['ur', 'اردو'], ['hi', 'हिन्दी']].map(([lang, label]) => <Chip key={lang} label={label} selected={config.language === lang} onPress={() => patch('language', lang)} />)}</View>
        <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('receipt.fontSize')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{[9, 11, 13, 16].map((size) => <Chip key={size} label={String(size)} selected={config.fontSize === size} onPress={() => patch('fontSize', size)} />)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{['normal', 'compact'].map((value) => <Chip key={value} label={t(`receipt.${value}`)} selected={config.spacing === value} onPress={() => patch('spacing', value)} />)}</View>
        <Card style={{ gap: spacing.sm }}>{['showLogo', 'showCustomer', 'showPhone', 'showRates'].map((key) => <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[typography.body, { flex: 1, color: colors.ink.primary }]}>{t(`receipt.${key}`)}</Text><Switch accessibilityLabel={t(`receipt.${key}`)} value={config[key]} onValueChange={(value) => patch(key, value)} /></View>)}</Card>
        <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('receipt.preview')}</Text>
        {preview ? <View style={{ height: 360 }}><WebView source={{ html: preview }} originWhitelist={['about:blank']} javaScriptEnabled={false} onShouldStartLoadWithRequest={({ url }) => url === 'about:blank'} /></View> : null}
        <ReceiptActions bill={sample} config={config} />
        <Button title={t('receipt.reset')} variant="ghost" onPress={reset} />
      </KeyboardAwareScrollView>
      <View style={{ padding: spacing.lg }}><Button title={t('receipt.save')} onPress={save} disabled={!shopId || busy} /></View>
    </KeyboardAwareView>
  </SafeAreaView>;
}
