import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { useRegisterMutation } from '../../hooks/useAuth';
import { subscriptionsApi } from '../../services/subscriptionsApi';
import { getOfferings, purchasePackage } from '../../services/revenueCat';

const PLAN_TIERS = [
  { tier: 'FREE_TRIAL', title: 'Free Trial', blurb: 'Full features, no card required', recommended: true },
  { tier: 'LIFETIME', title: 'Lifetime', blurb: 'One-time payment, single device' },
  { tier: 'CLOUD_SYNC', title: 'Cloud Sync', blurb: 'Monthly / semiannual / yearly · multi-device' },
];

export default function RegisterStep3() {
  const { colors, radii, typography, spacing } = useTheme();
  const store = useRegisterStore();
  const [planTier, setPlanTier] = useState('FREE_TRIAL');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const registerMutation = useRegisterMutation();

  const { data: plansData } = useQuery({ queryKey: ['subscriptionPlans'], queryFn: subscriptionsApi.plans });
  const plans = Array.isArray(plansData) ? plansData : plansData?.plans || [];

  function planForTier(tier) {
    if (tier === 'CLOUD_SYNC') {
      // Featured/default sub-plan for the wizard's single Cloud Sync card —
      // Subscription Plans (post-login) is where monthly/semiannual/yearly
      // get their own rows.
      return plans.find((p) => p.tier === 'CLOUD_SYNC' && p.billingCycle === 'YEARLY') || plans.find((p) => p.tier === 'CLOUD_SYNC');
    }
    return plans.find((p) => p.tier === tier);
  }

  function handleSubmit() {
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setError(null);

    registerMutation.mutate(
      {
        name: store.name,
        email: store.email,
        password: store.password,
        phone: store.phone || undefined,
        shopName: store.shopName,
        shopTypeCode: store.shopTypeCode,
      },
      {
        onSuccess: async () => {
          store.reset();
          // Backend always seeds FREE_TRIAL regardless of this pick. A
          // Lifetime/Cloud Sync pick drives the RevenueCat purchase right
          // away — best-effort: a failure here just leaves the new account
          // on its free trial, landing on Dashboard either way.
          if (planTier !== 'FREE_TRIAL') {
            const plan = planForTier(planTier);
            if (plan?.revenueCatProductId) {
              try {
                const offering = await getOfferings();
                const pkg = offering?.availablePackages?.find((p) => p.product.identifier === plan.revenueCatProductId);
                if (pkg) await purchasePackage(pkg);
              } catch (err) {
                console.warn('Post-registration purchase skipped:', err.message);
              }
            }
          }
        },
      }
    );
  }

  const submitError =
    error || (registerMutation.isError ? registerMutation.error?.response?.data?.message || 'Could not create your account.' : null);

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={2} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          {PLAN_TIERS.map((option) => {
            const selected = planTier === option.tier;
            const plan = planForTier(option.tier);
            return (
              <Card
                key={option.tier}
                onPress={() => setPlanTier(option.tier)}
                level={selected ? 'md' : 'none'}
                bordered={false}
                style={{
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.brand.accentDark : colors.surface.border,
                  backgroundColor: selected ? colors.brand.accentLight + '1F' : 'transparent',
                }}
              >
                {option.recommended ? (
                  <View style={{ position: 'absolute', top: -9, right: 12 }}>
                    <Badge label="RECOMMENDED" tone="warning" />
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={[typography.h3, { color: colors.ink.primary }]}>{option.title}</Text>
                  {plan ? (
                    <Text style={[typography.h3, { color: colors.brand.accentDark }]}>
                      {plan.isTrialPlan ? `${plan.durationDays} days free` : `${plan.currency} ${plan.price}`}
                    </Text>
                  ) : null}
                </View>
                <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: 4 }]}>{option.blurb}</Text>
              </Card>
            );
          })}

          <Pressable onPress={() => setAgreed((a) => !a)} style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                borderWidth: 1.5,
                borderColor: agreed ? colors.brand.primary : colors.ink.secondary,
                backgroundColor: agreed ? colors.brand.primary : 'transparent',
                marginTop: 1,
              }}
            />
            <Text style={[typography.caption, { color: colors.ink.secondary, flex: 1 }]}>
              I agree to the <Text style={{ color: colors.brand.accentDark, fontWeight: '600' }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.brand.accentDark, fontWeight: '600' }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {submitError ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{submitError}</Text> : null}
        </ScrollView>
        <View style={{ padding: spacing.lg }}>
          <Button title="Create Account" onPress={handleSubmit} loading={registerMutation.isPending} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
