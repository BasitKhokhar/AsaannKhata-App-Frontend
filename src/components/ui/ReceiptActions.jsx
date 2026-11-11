import { printerError } from '../../services/thermalPrinter';
import React, { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Eye, Printer, Share2 } from 'lucide-react-native';
import { Button } from './Button';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';
import { receiptDocument, printReceipt, shareReceipt } from '../../services/receipts';
import { showToast } from '../../store/toastStore';

export function ReceiptActions({ bill, config }) {
  const { colors, spacing, typography } = useTheme();
  const t = useT();
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statement, setStatement] = useState(false);
  const lock = useRef(false);
  async function act(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const options = { config, statement };
      if (action === 'preview') setPreview((await receiptDocument(bill, options)).html);
      else if (action === 'print') await printReceipt(bill, options);
      else await shareReceipt(bill, options);
    } catch (error) { showToast(t(error.message?.startsWith('receipt.') ? error.message : action === 'print' ? printerError(error) : 'receipt.failed'), 'error'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ gap: spacing.sm }}>
    {bill.payments?.length ? <Button title={t(statement ? 'receipt.statement' : 'receipt.original')} variant="ghost" onPress={() => setStatement(!statement)} /> : null}
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Button title={t('receipt.preview')} variant="outline" compact icon={<Eye size={15} color={colors.brand.primary} />} disabled={busy} onPress={() => act('preview')} style={{ flex: 1, minWidth: 0 }} />
      <Button title={t('billing.billDetail.print')} variant="outline" compact icon={<Printer size={15} color={colors.brand.primary} />} disabled={busy} onPress={() => act('print')} style={{ flex: 1, minWidth: 0 }} />
      <Button title={t('billing.billDetail.share')} compact icon={<Share2 size={15} color={colors.ink.inverse} />} disabled={busy} onPress={() => act('share')} style={{ flex: 1, minWidth: 0 }} />
    </View>
    <Modal visible={preview !== null} onRequestClose={() => setPreview(null)} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.bg }}>
        <View style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}><Button title={t('common.back')} variant="ghost" onPress={() => setPreview(null)} /><Text style={[typography.h3, { color: colors.ink.primary }]}>{t('receipt.preview')}</Text></View>
        {preview ? <WebView originWhitelist={['about:blank']} source={{ html: preview }} javaScriptEnabled={false} onShouldStartLoadWithRequest={({ url }) => url === 'about:blank'} /> : null}
      </SafeAreaView>
    </Modal>
  </View>;
}
