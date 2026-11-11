import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, CloudUpload, Database } from 'lucide-react-native';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTheme } from '../../theme';
import { useSyncStore } from '../../store/syncStore';
import { runSync } from '../../sync/syncEngine';
import { countPendingSyncRows } from '../../sync/pending';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export function ManualSyncSheet({ visible, onClose, shopIds }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const [pendingRows, setPendingRows] = useState(0);
  const [starting, setStarting] = useState(false);
  const shopKey = useMemo(() => shopIds.map(String).sort().join('|'), [shopIds]);

  useEffect(() => {
    if (!visible) return;
    setPendingRows(countPendingSyncRows(shopIds));
  }, [visible, shopKey]);

  async function handleSync() {
    if (starting || isSyncing) return;
    setStarting(true);
    try {
      await runSync();
      const syncError = useSyncStore.getState().lastError;
      if (syncError) {
        showToast(syncError, 'danger');
        return;
      }
      setPendingRows(countPendingSyncRows(shopIds));
      showToast(t('dashboard.syncModal.success'), 'success');
      onClose();
    } catch (error) {
      showToast(t('dashboard.syncModal.failed'), 'danger');
    } finally {
      setStarting(false);
    }
  }

  const loading = starting || isSyncing;

  return (
    <Sheet
      visible={visible}
      onClose={loading ? () => {} : onClose}
      title={t('dashboard.syncModal.title')}
      footer={
        <View style={{ gap: spacing.sm }}>
          <Button
            title={loading ? t('settings.syncStatus.syncing') : t('settings.syncStatus.syncNow')}
            icon={<CloudUpload size={18} color={colors.ink.onBrand} strokeWidth={1.8} />}
            onPress={handleSync}
            loading={loading}
          />
          <Button title={t('common.cancel')} variant="ghost" onPress={onClose} disabled={loading} />
        </View>
      }
    >
      <Text style={[typography.body, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.syncModal.description')}</Text>

      <Card level="none" style={{ gap: spacing.md }}>
        <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
            <Database size={19} color={colors.brand.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{t('dashboard.syncModal.pendingRecords')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('dashboard.syncModal.pendingDescription')}</Text>
          </View>
          <Text style={[typography.numericLarge, { color: colors.brand.primary }]}>{pendingRows}</Text>
        </View>
      </Card>

      <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.semantic.successBg }}>
        <CheckCircle2 size={18} color={colors.semantic.success} />
        <Text style={[typography.caption, { flex: 1, color: colors.semantic.success, textAlign }]}>{t('dashboard.syncModal.ready')}</Text>
      </View>
    </Sheet>
  );
}
