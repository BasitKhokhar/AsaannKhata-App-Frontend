import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Coins, PlayCircle, Cloud, Clock } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useCoinsStore } from '../../store/coinsStore';
import { useShopStore } from '../../store/shopStore';
import { adsService, rewardedAdAvailability } from '../../services/adsService';
import { adsApi } from '../../services/adsApi';
import { showToast } from '../../store/toastStore';
import { categoryRepository } from '../../db/repositories/categoryRepository';
import { productRepository } from '../../db/repositories/productRepository';
import { customerRepository } from '../../db/repositories/customerRepository';
import { billRepository } from '../../db/repositories/billRepository';
import { stockRepository } from '../../db/repositories/stockRepository';
import { customerPaymentRepository } from '../../db/repositories/customerPaymentRepository';
import { useT, useIsUrdu } from '../../store/languageStore';

// Any row this device still owes the server — used to decide whether
// "Unlock sync now" is worth showing. A cheap local count, not a network
// call, so it reads instantly even offline.
function countPendingSyncRows(shopId) {
  if (!shopId) return 0;
  return [categoryRepository, productRepository, customerRepository, billRepository, stockRepository, customerPaymentRepository].reduce(
    (total, repo) => total + repo.listPending(shopId).length,
    0
  );
}

export default function EarnCoins() {
  const { colors, radii, typography, spacing } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const adCoins = useCoinsStore((s) => s.adCoins);
  const adsRemainingToday = useCoinsStore((s) => s.adsRemainingToday);
  const maxRewardAdsPerDay = useCoinsStore((s) => s.maxRewardAdsPerDay);
  const rewardAdCoinValue = useCoinsStore((s) => s.rewardAdCoinValue);
  const syncCoinCost = useCoinsStore((s) => s.syncCoinCost);
  const cloudEnabled = useCoinsStore((s) => s.cloudEnabled);
  const [watching, setWatching] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [pendingRows, setPendingRows] = useState(0);
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const refresh = useCallback(() => {
    useCoinsStore.getState().refresh().catch(() => {});
    setPendingRows(countPendingSyncRows(activeShopId));
  }, [activeShopId]);

  useEffect(() => {
    adsService.preloadRewardedAd();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const { available: canWatchAd, reason: blockedReason } = rewardedAdAvailability();
  const adsExhausted = adsRemainingToday <= 0;

  async function handleWatchAd() {
    setWatching(true);
    try {
      const result = await adsService.showRewardedAd();
      if (result.earned) {
        showToast(t('subscription.earnCoins.toastEarned').replace('{coins}', rewardAdCoinValue || ''), 'success');
      } else if (result.wasShown) {
        showToast(t('subscription.earnCoins.toastClosedEarly'), 'warning');
      } else if (result.reason === 'cooldown') {
        showToast(t('subscription.earnCoins.toastCooldown'), 'warning');
      } else if (result.reason === 'daily_cap') {
        showToast(t('subscription.earnCoins.toastDailyCap'), 'warning');
      } else if (result.reason === 'not_ready') {
        showToast(t('subscription.earnCoins.toastNotReady'), 'neutral');
      } else {
        showToast(t('subscription.earnCoins.toastGenericFail'), 'danger');
      }
    } finally {
      setWatching(false);
      refresh();
    }
  }

  async function handleUnlockSync() {
    setUnlocking(true);
    try {
      const result = await adsApi.unlockSync();
      useCoinsStore.getState().applyUnlockResult(result);
      showToast(t('subscription.earnCoins.toastSyncUnlocked'), 'success');
      refresh();
    } catch (err) {
      if (err?.response?.status === 402) {
        showToast(t('subscription.earnCoins.toastNotEnoughCoins'), 'warning');
      } else {
        showToast(t('subscription.earnCoins.toastUnlockFail'), 'danger');
      }
    } finally {
      setUnlocking(false);
    }
  }

  const showUnlockSync = !cloudEnabled && pendingRows > 0;

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign }]}>{t('settings.earnCoins')}</Text>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Card level="md" style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.pill,
                backgroundColor: colors.brand.accentLight + '3D',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={28} color={colors.brand.accentDark} strokeWidth={1.8} />
            </View>
            <Text style={[typography.display, { color: colors.ink.primary }]}>{adCoins}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('subscription.earnCoins.coinBalance')}</Text>
          </Card>

          <Card>
            <SectionHeader title={t('subscription.earnCoins.watchAdSectionTitle')} style={{ flexDirection: rowDirection }} />
            <Text style={[typography.caption, { color: colors.ink.secondary, marginBottom: spacing.md, textAlign }]}>
              {adsExhausted
                ? t('subscription.earnCoins.exhausted')
                : t('subscription.earnCoins.watchDescription')
                    .replace('{coins}', rewardAdCoinValue || '')
                    .replace('{remaining}', adsRemainingToday)
                    .replace('{max}', maxRewardAdsPerDay)}
            </Text>
            <Button
              title={t('subscription.earnCoins.watchAdButton')}
              variant="accent"
              icon={<PlayCircle size={18} color={colors.ink.primary} strokeWidth={1.8} />}
              loading={watching}
              disabled={watching || !canWatchAd}
              onPress={handleWatchAd}
            />
            {!canWatchAd && blockedReason === 'cooldown' ? (
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
                <Clock size={13} color={colors.semantic.warning} strokeWidth={1.8} />
                <Text style={[typography.caption, { color: colors.semantic.warning }]}>
                  {t('subscription.earnCoins.cooldownWarning')}
                </Text>
              </View>
            ) : null}
          </Card>

          {showUnlockSync ? (
            <Card>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                <SectionHeader title={t('subscription.earnCoins.unlockSyncTitle')} style={{ marginBottom: 0, flex: 1 }} />
                <Badge label={t('subscription.earnCoins.coinsBadge').replace('{count}', syncCoinCost)} tone="brand" />
              </View>
              <Text style={[typography.caption, { color: colors.ink.secondary, marginBottom: spacing.md, textAlign }]}>
                {t('subscription.earnCoins.unlockDescription').replace('{count}', pendingRows)}
              </Text>
              <Button
                title={t('subscription.earnCoins.unlockSyncTitle')}
                variant="outline"
                icon={<Cloud size={16} color={colors.brand.primary} strokeWidth={1.8} />}
                loading={unlocking}
                disabled={unlocking || adCoins < syncCoinCost}
                onPress={handleUnlockSync}
              />
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
