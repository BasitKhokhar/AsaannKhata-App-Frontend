import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { subscriptionsApi } from '../../services/subscriptionsApi';
import { useEntitlement, refreshEntitlement } from '../../hooks/useEntitlement';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/revenueCat';
import { formatCurrency } from '../../utils/money';

export default function SubscriptionPlans() {
  const { colors, radii, typography, spacing } = useTheme();
  const queryClient = useQueryClient();
  const { data: entitlement } = useEntitlement();
  const [selectedCode, setSelectedCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const { data: plansData } = useQuery({ queryKey: ['subscriptionPlans'], queryFn: subscriptionsApi.plans });
  const plans = (Array.isArray(plansData) ? plansData : plansData?.plans || []).filter((p) => p.isActive !== false);

  const currentPlanCode = entitlement?.planCode;

  async function handlePurchase(plan) {
    if (plan.tier === 'FREE_TRIAL') return;
    setBusy(true);
    setMessage(null);
    try {
      const offering = await getOfferings();
      const pkg = offering?.availablePackages?.find((p) => p.product.identifier === plan.revenueCatProductId);
      if (!pkg) {
        setMessage('This plan is not yet available for purchase — check back soon.');
        return;
      }
      await purchasePackage(pkg);
      await refreshEntitlement(queryClient);
      setMessage('Subscription updated!');
    } catch (err) {
      if (err?.userCancelled) return;
      setMessage(err.message || 'Purchase could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    setMessage(null);
    try {
      await restorePurchases();
      await refreshEntitlement(queryClient);
      setMessage('Purchases restored.');
    } catch (err) {
      setMessage(err.message || 'Could not restore purchases.');
    } finally {
      setBusy(false);
    }
  }

  function handleManage() {
    const url = Platform.OS === 'ios' ? 'itms-apps://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => {});
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Plans</Text>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const selected = selectedCode === plan.code || (!selectedCode && isCurrent);
            return (
              <Pressable
                key={plan.code}
                onPress={() => setSelectedCode(plan.code)}
                style={{
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.brand.accentDark : colors.surface.border,
                  backgroundColor: selected ? colors.brand.accentLight + '1A' : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={[typography.h3, { color: colors.ink.primary }]}>{plan.name}</Text>
                  <Text style={[typography.h3, { color: colors.brand.accentDark }]}>
                    {plan.isTrialPlan ? `${plan.durationDays} days free` : formatCurrency(plan.price, plan.currency)}
                  </Text>
                </View>
                {plan.billingCycle ? (
                  <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 2 }]}>billed {plan.billingCycle.toLowerCase()}</Text>
                ) : null}
                <View style={{ marginTop: spacing.sm, gap: 2 }}>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>✓ {plan.cloudEnabled ? 'Cloud sync across devices' : 'Offline on this device'}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>✓ Up to {plan.maxDevices} device{plan.maxDevices === 1 ? '' : 's'}</Text>
                </View>
                {isCurrent ? <Badge label="CURRENT PLAN" tone="success" /> : null}
              </Pressable>
            );
          })}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Pressable onPress={handleManage}>
              <Text style={[typography.label, { color: colors.brand.accentDark }]}>Manage Subscription</Text>
            </Pressable>
            <Pressable onPress={handleRestore}>
              <Text style={[typography.label, { color: colors.ink.secondary }]}>Restore Purchases</Text>
            </Pressable>
          </View>

          {message ? <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>{message}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button
            title="Continue"
            loading={busy}
            onPress={() => {
              const plan = plans.find((p) => p.code === selectedCode);
              if (plan) handlePurchase(plan);
            }}
            disabled={!selectedCode || selectedCode === currentPlanCode}
          />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
