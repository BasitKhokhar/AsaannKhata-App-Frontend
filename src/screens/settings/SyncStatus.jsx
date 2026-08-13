import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme';
import { useSyncStore } from '../../store/syncStore';
import { useShops } from '../../hooks/useShops';
import { entitlementRepository } from '../../db/repositories/entitlementRepository';
import { runSync } from '../../sync/syncEngine';
import { formatRelativeTime } from '../../utils/dates';

export default function SyncStatus() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const { data: shops = [] } = useShops();
  const { isSyncing, lastSyncAt, perShopStatus } = useSyncStore();
  const entitlement = entitlementRepository.get();

  if (!entitlement?.cloudEnabled) {
    return (
      <AnimatedScreen style={{ alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Svg width={64} height={64} viewBox="0 0 24 24">
          <Path d="M4 12a8 8 0 0 1 13.6-5.6M20 12a8 8 0 0 1-13.6 5.6" stroke={colors.brand.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Svg>
        <Text style={[typography.h2, { color: colors.ink.primary, marginTop: spacing.lg, textAlign: 'center' }]}>Cloud Sync isn't active</Text>
        <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.sm, textAlign: 'center' }]}>
          Your plan works fully offline on this device. Upgrade to Cloud Sync to back up and sync across multiple devices.
        </Text>
        <Button title="Upgrade to Cloud Sync" variant="accent" onPress={() => navigation.navigate('SubscriptionPlans')} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1, padding: spacing.lg }}>
        <Text style={[typography.h1, { color: colors.ink.primary, marginBottom: spacing.xl }]}>Sync Status</Text>

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
          <Text style={[typography.h3, { color: colors.ink.primary, marginTop: spacing.sm }]}>{isSyncing ? 'Syncing…' : 'All shops synced'}</Text>
          <Text style={[typography.caption, { color: colors.ink.secondary }]}>
            Last synced: {lastSyncAt ? formatRelativeTime(lastSyncAt) : 'never'}
          </Text>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {shops.map((shop) => {
            const status = perShopStatus[shop.id] || 'queued';
            const label = status === 'synced' ? 'Synced' : status === 'syncing' ? 'Syncing…' : status === 'error' ? 'Error' : 'Queued (offline)';
            const color = status === 'synced' ? colors.semantic.success : status === 'error' ? colors.semantic.danger : colors.semantic.warning;
            return (
              <Card key={shop.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <Text style={[typography.body, { color: colors.ink.primary }]}>{shop.name}</Text>
                <Text style={[typography.label, { color }]}>{label}</Text>
              </Card>
            );
          })}
        </View>

        <View style={{ marginTop: 'auto' }}>
          <Button title="Sync Now" variant="outline" onPress={runSync} loading={isSyncing} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
