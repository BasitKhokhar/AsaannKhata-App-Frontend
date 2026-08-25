import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Crown, AlertCircle, Settings2, RotateCcw } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { subscriptionsApi } from '../../services/subscriptionsApi';
import { useEntitlement, refreshEntitlement } from '../../hooks/useEntitlement';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/revenueCat';
import { showToast } from '../../store/toastStore';
import { formatCurrency } from '../../utils/money';

function PlanFeature({ text, colors, typography }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Check size={14} color={colors.semantic.success} />
      <Text style={[typography.caption, { color: colors.ink.secondary }]}>{text}</Text>
    </View>
  );
}

export default function SubscriptionPlans() {
  const { mode, colors, radii, typography, spacing } = useTheme();
  const queryClient = useQueryClient();
  const { data: entitlement } = useEntitlement();
  const [selectedCode, setSelectedCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const { data: plansData } = useQuery({ queryKey: ['subscriptionPlans'], queryFn: subscriptionsApi.plans });
  const plans = (Array.isArray(plansData) ? plansData : plansData?.plans || []).filter((p) => p.isActive !== false);

  const currentPlanCode = entitlement?.planCode;
  // Dark mode's card surface sits closer to the accent hue than the light
  // surface does, so the same 10% alpha tint reads as almost no tint at all
  // — bump it up a bit in dark mode to keep the selected state legible.
  const selectedTint = colors.brand.accentLight + (mode === 'dark' ? '29' : '1A');

  async function handlePurchase(plan) {
    if (plan.tier === 'FREE_TRIAL') return;
    setBusy(true);
    setMessage(null);
    try {
      const offering = await getOfferings();
      const pkg = offering?.availablePackages?.find((p) => p.product.identifier === plan.revenueCatProductId);
      if (!pkg) {
        setMessage({ text: 'This plan is not yet available for purchase — check back soon.', tone: 'warning' });
        return;
      }
      await purchasePackage(pkg);
      await refreshEntitlement(queryClient);
      showToast('Subscription updated!', 'success');
    } catch (err) {
      if (err?.userCancelled) return;
      setMessage({ text: err.message || 'Purchase could not be completed.', tone: 'danger' });
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
      showToast('Purchases restored.', 'success');
    } catch (err) {
      setMessage({ text: err.message || 'Could not restore purchases.', tone: 'danger' });
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
              <Card
                key={plan.code}
                onPress={() => setSelectedCode(plan.code)}
                level={selected ? 'md' : 'sm'}
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.brand.accentDark : colors.surface.border,
                  backgroundColor: selected ? selectedTint : colors.surface.card,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {plan.cloudEnabled ? <Crown size={16} color={colors.brand.accentDark} /> : null}
                    <Text style={[typography.h3, { color: colors.ink.primary }]}>{plan.name}</Text>
                  </View>
                  <Text style={[typography.h3, { color: colors.brand.accentDark }]}>
                    {plan.isTrialPlan ? `${plan.durationDays} days free` : formatCurrency(plan.price, plan.currency)}
                  </Text>
                </View>
                {plan.billingCycle ? (
                  <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 2 }]}>billed {plan.billingCycle.toLowerCase()}</Text>
                ) : null}
                <View style={{ marginTop: spacing.sm, gap: 4 }}>
                  <PlanFeature
                    text={plan.cloudEnabled ? 'Cloud sync across devices' : 'Offline on this device'}
                    colors={colors}
                    typography={typography}
                  />
                  <PlanFeature
                    text={`Up to ${plan.maxDevices} device${plan.maxDevices === 1 ? '' : 's'}`}
                    colors={colors}
                    typography={typography}
                  />
                </View>
                {isCurrent ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <Badge label="CURRENT PLAN" tone="success" />
                  </View>
                ) : null}
              </Card>
            );
          })}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Pressable onPress={handleManage} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={8}>
              <Settings2 size={14} color={colors.brand.accentDark} />
              <Text style={[typography.label, { color: colors.brand.accentDark }]}>Manage Subscription</Text>
            </Pressable>
            <Pressable onPress={handleRestore} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={8}>
              <RotateCcw size={14} color={colors.ink.secondary} />
              <Text style={[typography.label, { color: colors.ink.secondary }]}>Restore Purchases</Text>
            </Pressable>
          </View>

          {message ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                borderRadius: radii.md,
                padding: spacing.sm,
                backgroundColor: message.tone === 'danger' ? colors.semantic.dangerBg : colors.semantic.warningBg,
              }}
            >
              <AlertCircle size={16} color={message.tone === 'danger' ? colors.semantic.danger : colors.semantic.warning} />
              <Text
                style={[
                  typography.caption,
                  { color: message.tone === 'danger' ? colors.semantic.danger : colors.semantic.warning, flex: 1 },
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}
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
