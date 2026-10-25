import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { Smartphone } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ListRow } from '../../components/ui/ListRow';
import { useTheme } from '../../theme';
import { useSyncStore } from '../../store/syncStore';
import { useShops } from '../../hooks/useShops';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { runSync } from '../../sync/syncEngine';
import { formatRelativeTime } from '../../utils/dates';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function SyncStatus() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: shops = [] } = useShops();
  const { isSyncing, lastSyncAt, lastError, perShopStatus } = useSyncStore();
  const entitlement = entitlementRepository.get();
  const { data: syncStatusData } = useSyncStatus();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  if (!entitlement?.cloudEnabled) {
    return (
      <AnimatedScreen style={{ alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Svg width={64} height={64} viewBox="0 0 24 24">
          <Path d="M4 12a8 8 0 0 1 13.6-5.6M20 12a8 8 0 0 1-13.6 5.6" stroke={colors.brand.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Svg>
        <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.lg, textAlign: 'center' }]}>{t('settings.syncStatus.notActiveTitle')}</Text>
        <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.sm, textAlign: 'center' }]}>
          {t('settings.syncStatus.notActiveDescription')}
        </Text>
        <Button title={t('settings.syncStatus.upgradeButton')} variant="accent" onPress={() => navigation.navigate('SubscriptionPlans')} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1, padding: spacing.lg }}>
        <Text style={[typography.h1, { color: colors.ink.primary, marginBottom: spacing.xl, textAlign }]}>{t('settings.syncStatus')}</Text>

        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.semantic.successBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={40} height={40} viewBox="0 0 24 24">
              <Path d="M4 12a8 8 0 0 1 13.6-5.6M20 12a8 8 0 0 1-13.6 5.6" stroke={colors.semantic.success} strokeWidth={1.8} fill="none" strokeLinecap="round" />
              <Path d="M17.6 3v3.4H14.2M6.4 21v-3.4h3.4" stroke={colors.semantic.success} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={[typography.h3, { color: colors.ink.primary, marginTop: spacing.sm }]}>
            {isSyncing ? t('settings.syncStatus.syncing') : lastError ? t('settings.syncStatus.statusError') : t('settings.syncStatus.allSynced')}
          </Text>
          <Text style={[typography.caption, { color: colors.ink.secondary }]}>
            {t('settings.syncStatus.lastSynced').replace('{time}', lastSyncAt ? formatRelativeTime(lastSyncAt) : t('settings.syncStatus.never'))}
          </Text>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {shops.map((shop) => {
            const status = perShopStatus[shop.id] || 'queued';
            const label =
              status === 'synced'
                ? t('settings.syncStatus.statusSynced')
                : status === 'syncing'
                ? t('settings.syncStatus.syncing')
                : status === 'error'
                ? t('settings.syncStatus.statusError')
                : t('settings.syncStatus.statusQueued');
            const color = status === 'synced' ? colors.semantic.success : status === 'error' ? colors.semantic.danger : colors.semantic.warning;
            return (
              <Card key={shop.id} style={{ flexDirection: rowDirection, justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <Text style={[typography.body, { color: colors.ink.primary }]}>{shop.name}</Text>
                <Text style={[typography.label, { color }]}>{label}</Text>
              </Card>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title={t('settings.syncStatus.devices')} style={{ flexDirection: rowDirection }} />
          <Card bordered={false} style={{ padding: spacing.xs }}>
            <ListRow
              style={{ flexDirection: rowDirection }}
              leading={
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.md,
                    backgroundColor: colors.brand.primary + '1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Smartphone size={18} color={colors.brand.primary} strokeWidth={1.8} />
                </View>
              }
              title={
                syncStatusData
                  ? t('settings.syncStatus.devicesUsed').replace('{active}', syncStatusData.activeDeviceCount).replace('{max}', syncStatusData.maxDevices)
                  : t('settings.syncStatus.loadingDeviceUsage')
              }
              titleStyle={{ textAlign }}
              subtitle={syncStatusData?.tier ? t('settings.syncStatus.plan').replace('{tier}', syncStatusData.tier) : undefined}
            />
          </Card>
        </View>

        <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
          <Button title={t('settings.syncStatus.syncNow')} variant="outline" onPress={runSync} loading={isSyncing} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
