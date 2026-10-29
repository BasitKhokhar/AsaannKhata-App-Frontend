import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, CloudUpload, Coins, Database, PlayCircle } from 'lucide-react-native';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTheme } from '../../theme';
import { useCoinsStore } from '../../store/coinsStore';
import { useSyncStore } from '../../store/syncStore';
import { adsService } from '../../services/adsService';
import { adsApi } from '../../services/adsApi';
import { runSync } from '../../sync/syncEngine';
import { countPendingSyncRows } from '../../sync/pending';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export function ManualSyncSheet({ visible, onClose, shopIds, cloudEnabled }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const adCoins = useCoinsStore((state) => state.adCoins);
  const syncCoinCost = useCoinsStore((state) => state.syncCoinCost);
  const syncUnlockExpiresAt = useCoinsStore((state) => state.syncUnlockExpiresAt);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const [pendingRows, setPendingRows] = useState(0);
  const [watching, setWatching] = useState(false);
  const [starting, setStarting] = useState(false);
  const shopKey = useMemo(() => shopIds.map(String).sort().join('|'), [shopIds]);
  const unlockActive = !!syncUnlockExpiresAt && Date.parse(syncUnlockExpiresAt) > Date.now();
  const needsUnlock = !cloudEnabled && !unlockActive;
  const canStart = !needsUnlock || adCoins >= syncCoinCost;

  useEffect(() => {
    if (!visible) return;
    setPendingRows(countPendingSyncRows(shopIds));
    if (!cloudEnabled) {
      adsService.preloadRewardedAd();
      useCoinsStore.getState().refresh().catch(() => {});
    }
  }, [visible, cloudEnabled, shopKey]);

  async function handleWatchAd() {
    setWatching(true);
    try {
      const result = await adsService.showRewardedAd();
      if (result.earned) showToast(t('dashboard.syncModal.coinsEarned'), 'success');
      else if (result.reason === 'cooldown') showToast(t('subscription.earnCoins.toastCooldown'), 'warning');
      else if (result.reason === 'daily_cap') showToast(t('subscription.earnCoins.toastDailyCap'), 'warning');
      else showToast(t('subscription.earnCoins.toastNotReady'), 'neutral');
    } finally {
      setWatching(false);
    }
  }

  async function handleSync() {
    if (!canStart || starting || isSyncing) return;
    setStarting(true);
    try {
      if (needsUnlock) {
        const result = await adsApi.unlockSync();
        useCoinsStore.getState().applyUnlockResult(result);
      }
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
      if (error?.response?.status === 402) showToast(t('subscription.earnCoins.toastNotEnoughCoins'), 'warning');
      else showToast(t('dashboard.syncModal.failed'), 'danger');
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
            disabled={!canStart}
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

      {cloudEnabled || unlockActive ? (
        <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.semantic.successBg }}>
          <CheckCircle2 size={18} color={colors.semantic.success} />
          <Text style={[typography.caption, { flex: 1, color: colors.semantic.success, textAlign }]}>{t('dashboard.syncModal.ready')}</Text>
        </View>
      ) : (
        <Card level="none" style={{ gap: spacing.md }}>
          <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{t('dashboard.syncModal.yourCoins')}</Text>
            <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs }}>
              <Coins size={17} color={colors.semantic.warning} />
              <Text style={[typography.h3, { color: colors.semantic.warning }]}>{adCoins}</Text>
            </View>
          </View>
          <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{t('dashboard.syncModal.syncCost')}</Text>
            <Text style={[typography.h3, { color: colors.ink.secondary }]}>{syncCoinCost}</Text>
          </View>
          {!canStart ? (
            <>
              <Text style={[typography.caption, { color: colors.semantic.warning, textAlign }]}>{t('dashboard.syncModal.needCoins').replace('{count}', Math.max(0, syncCoinCost - adCoins))}</Text>
              <Button
                title={t('subscription.earnCoins.watchAdButton')}
                variant="accent"
                icon={<PlayCircle size={18} color={colors.ink.primary} />}
                onPress={handleWatchAd}
                loading={watching}
              />
            </>
          ) : null}
        </Card>
      )}
    </Sheet>
  );
}
