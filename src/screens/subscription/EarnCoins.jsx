import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Coins, PlayCircle, Clock } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useCoinsStore } from '../../store/coinsStore';
import { adsService, rewardedAdAvailability } from '../../services/adsService';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function EarnCoins() {
  const { colors, radii, typography, spacing } = useTheme();
  const adCoins = useCoinsStore((s) => s.adCoins);
  const adsRemainingToday = useCoinsStore((s) => s.adsRemainingToday);
  const maxRewardAdsPerDay = useCoinsStore((s) => s.maxRewardAdsPerDay);
  const rewardAdCoinValue = useCoinsStore((s) => s.rewardAdCoinValue);
  const rewardedCooldownUntil = useCoinsStore((s) => s.rewardedCooldownUntil);
  const [watching, setWatching] = useState(false);
  const [now, setNow] = useState(Date.now());
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const refresh = useCallback(() => {
    useCoinsStore.getState().refresh().catch(() => {});
  }, []);

  useEffect(() => {
    adsService.preloadRewardedAd();
  }, []);

  useEffect(() => {
    if (!rewardedCooldownUntil || rewardedCooldownUntil <= Date.now()) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= rewardedCooldownUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [rewardedCooldownUntil]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const { available: canWatchAd, reason: blockedReason } = rewardedAdAvailability();
  const adsExhausted = adsRemainingToday <= 0;
  const cooldownSeconds = Math.max(0, Math.ceil(((rewardedCooldownUntil || 0) - now) / 1000));
  const cooldownTime = `${String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}:${String(cooldownSeconds % 60).padStart(2, '0')}`;

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

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('settings.earnCoins')} />

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
                  {t('subscription.earnCoins.cooldownWarning').replace('{time}', cooldownTime)}
                </Text>
              </View>
            ) : null}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
