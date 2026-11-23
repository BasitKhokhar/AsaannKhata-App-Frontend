import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, CloudUpload, Coins, Database, PlayCircle, X } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { Skeleton } from '../ui/Skeleton';
import { useTheme } from '../../theme';
import { useSyncStore } from '../../store/syncStore';
import { useCoinsStore } from '../../store/coinsStore';
import { adsService } from '../../services/adsService';
import { adsApi } from '../../services/adsApi';
import { runSync } from '../../sync/syncEngine';
import { countPendingSyncRows } from '../../sync/pending';
import { showToast } from '../../store/toastStore';
import { showConfirm } from '../../store/confirmStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export function ManualSyncModal({ visible, onClose, shopIds, cloudEnabled }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const adCoins = useCoinsStore((state) => state.adCoins);
  const syncCoinCost = useCoinsStore((state) => state.syncCoinCost);
  const syncUnlockExpiresAt = useCoinsStore((state) => state.syncUnlockExpiresAt);
  const usageSnapshotReady = useCoinsStore((state) => state.usageSnapshotReady);
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const [pendingRows, setPendingRows] = useState(0);
  const [watching, setWatching] = useState(false);
  const [starting, setStarting] = useState(false);
  const watchingRef = useRef(false);
  const startingRef = useRef(false);
  const shopKey = useMemo(() => shopIds.map(String).sort().join('|'), [shopIds]);
  const unlockActive = !!syncUnlockExpiresAt && Date.parse(syncUnlockExpiresAt) > Date.now();
  const needsUnlock = !cloudEnabled && !unlockActive;
  const canStart = !needsUnlock || (usageSnapshotReady && adCoins >= syncCoinCost);

  useEffect(() => {
    if (!visible) {
      startingRef.current = false;
      watchingRef.current = false;
      setStarting(false);
      setWatching(false);
      return;
    }
    setPendingRows(countPendingSyncRows(shopIds));
    if (!cloudEnabled) {
      adsService.preloadRewardedAd();
      useCoinsStore.getState().refresh().catch(() => { });
    }
  }, [visible, cloudEnabled, shopKey]);

  async function handleWatchAd() {
    if (watchingRef.current || startingRef.current) return;
    watchingRef.current = true;
    setWatching(true);
    try {
      const result = await adsService.showRewardedAd();
      if (result.earned) {
        await useCoinsStore.getState().refresh().catch(() => { });
        showToast(t('dashboard.syncModal.coinsEarned'), 'success');
      }
      else if (result.reason === 'cooldown') showToast(t('subscription.earnCoins.toastCooldown'), 'warning');
      else if (result.reason === 'daily_cap') showToast(t('subscription.earnCoins.toastDailyCap'), 'warning');
      else showToast(t('subscription.earnCoins.toastNotReady'), 'neutral');
    } finally {
      watchingRef.current = false;
      setWatching(false);
    }
  }

  async function handleSync() {
    if (!canStart || startingRef.current || watchingRef.current || isSyncing) return;
    startingRef.current = true;
    setStarting(true);
    let completed = false;
    try {
      if (needsUnlock) {
        const unlock = await adsApi.unlockSync();
        useCoinsStore.getState().applyUnlockResult(unlock);
      }
      let result = await runSync();
      if (result?.code === 'DEVICE_LIMIT_REACHED') {
        const replaceExisting = await showConfirm({
          title: t('dashboard.syncModal.deviceLimitTitle'),
          message: t('dashboard.syncModal.deviceLimitMessage'),
          confirmLabel: t('dashboard.syncModal.replaceDevice'),
          cancelLabel: t('common.cancel'),
          isUrgent: true,
        });
        if (!replaceExisting) return;
        result = await runSync({ replaceExistingDevices: true });
      }
      if (!result?.ok) {
        showToast(result?.message || t('dashboard.syncModal.failed'), 'danger');
        return;
      }
      setPendingRows(countPendingSyncRows(shopIds));
      completed = true;
    } catch (error) {
      if (error?.response?.status === 402) showToast(t('subscription.earnCoins.toastNotEnoughCoins'), 'warning');
      else showToast(t('dashboard.syncModal.failed'), 'danger');
    } finally {
      if (!cloudEnabled) await useCoinsStore.getState().refresh().catch(() => { });
      startingRef.current = false;
      setStarting(false);
      if (completed) {
        showToast(t('dashboard.syncModal.success'), 'success');
        onClose();
      }
    }
  }

  const loading = starting;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={loading ? () => { } : onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface.overlay }]} onPress={loading || watching ? undefined : onClose} />
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          <View style={{
            width: '100%', maxWidth: 520, maxHeight: '88%', alignSelf: 'center', overflow: 'hidden',
            borderRadius: radii.xl, borderWidth: 1, borderColor: colors.surface.border,
            backgroundColor: colors.surface.raised
          }}>
            <View style={{
              flexDirection: direction, alignItems: 'center', gap: spacing.sm, padding: spacing.lg,
              borderBottomWidth: 1, borderBottomColor: colors.surface.border
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.brand.accentLight
              }}>
                <CloudUpload size={21} color={colors.brand.primary} strokeWidth={1.9} />
              </View>
              <Text style={[typography.h2, { flex: 1, color: colors.ink.primary, textAlign }]}>{t('dashboard.syncModal.title')}</Text>
              {loading ? <ActivityIndicator color={colors.brand.primary} /> : <IconButton icon={X} onPress={onClose} size={18} />}
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
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
              ) : null}

              {!cloudEnabled ? (
                <Card level="none" style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{t('dashboard.syncModal.yourCoins')}</Text>
                    <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.xs }}>
                      <Coins size={17} color={colors.semantic.warning} />
                      {usageSnapshotReady
                        ? <Text style={[typography.h3, { color: colors.semantic.warning }]}>{adCoins}</Text>
                        : <Skeleton width={26} height={18} />}
                    </View>
                  </View>
                  {needsUnlock ? <View style={{ flexDirection: direction, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{t('dashboard.syncModal.syncCost')}</Text>
                    {usageSnapshotReady
                      ? <Text style={[typography.h3, { color: colors.ink.secondary }]}>{syncCoinCost}</Text>
                      : <Skeleton width={26} height={18} />}
                  </View> : null}
                  {usageSnapshotReady && !canStart ? (
                    <>
                      <Text style={[typography.caption, { color: colors.semantic.warning, textAlign }]}>{t('dashboard.syncModal.needCoins').replace('{count}', Math.max(0, syncCoinCost - adCoins))}</Text>
                      <Button
                        title={t('subscription.earnCoins.watchAdButton')}
                        variant="accent"
                        icon={<PlayCircle size={18} color={colors.ink.primary} />}
                        onPress={handleWatchAd}
                        loading={watching}
                        disabled={starting || isSyncing}
                      />
                    </>
                  ) : null}
                </Card>
              ) : null}
            </ScrollView>

            <View style={{
              gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
              borderTopWidth: 1, borderTopColor: colors.surface.border, backgroundColor: colors.surface.raised
            }}>
              <Button
                title={loading ? t('settings.syncStatus.syncing') : t('settings.syncStatus.syncNow')}
                icon={<CloudUpload size={18} color={colors.ink.onBrand} strokeWidth={1.8} />}
                onPress={handleSync}
                loading={loading}
                disabled={!canStart || watching || isSyncing || starting}
              />
              <Button title={t('common.cancel')} variant="ghost" onPress={onClose} disabled={loading || watching} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
