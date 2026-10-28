import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Crown, AlertCircle, Settings2, RotateCcw } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { subscriptionsApi } from '../../services/subscriptionsApi';
import { useEntitlement, verifyRevenueCatEntitlement } from '../../hooks/useEntitlement';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/revenueCat';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu, useLanguageStore } from '../../store/languageStore';

const CYCLE_ORDER = { MONTHLY: 0, SEMIANNUAL: 1, YEARLY: 2 };

function planFeatures(plan, t, lang) {
  const supplied = Array.isArray(plan.features) ? plan.features : [];
  const features = supplied.map((item) => typeof item === 'string' ? item
    : item?.[lang] || item?.en || item?.text || item?.label || item?.title).filter((item) => typeof item === 'string' && item.trim());
  if (features.length) return features;
  return [
    plan.cloudEnabled ? t('subscription.plans.cloudSyncFeature') : t('subscription.plans.offlineFeature'),
    t('subscription.plans.maxDevices').replace('{count}', plan.maxDevices),
  ];
}

function packageFor(offering, plan) {
  return offering?.availablePackages?.find((pkg) => pkg.product?.identifier === plan.revenueCatProductId);
}

function timeRemaining(expiryDate, now, t) {
  const remaining = new Date(expiryDate).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return t('subscription.plans.expired');
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return t('subscription.plans.timeRemaining').replace('{days}', days).replace('{hours}', hours).replace('{minutes}', minutes);
}

export default function SubscriptionPlans() {
  const { mode, colors, radii, typography, spacing } = useTheme();
  const queryClient = useQueryClient();
  const adminId = useAuthStore((s) => s.adminId);
  const { data: entitlement } = useEntitlement();
  const [selectedCode, setSelectedCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [now, setNow] = useState(Date.now());
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscriptionPlans'], queryFn: subscriptionsApi.plans,
  });
  const { data: offering, isLoading: offeringLoading, error: offeringError, refetch: refetchOffering } = useQuery({
    queryKey: ['revenueCatOffering', adminId], queryFn: () => getOfferings(adminId), enabled: !!adminId,
    retry: false, staleTime: 5 * 60_000,
  });

  useFocusEffect(React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
    queryClient.invalidateQueries({ queryKey: ['revenueCatOffering', adminId] });
    queryClient.invalidateQueries({ queryKey: ['entitlement'] });
  }, [queryClient, adminId]));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const plans = (Array.isArray(plansData) ? plansData : plansData?.plans || []).filter((p) => p.isActive !== false);
  const cloudPlans = plans.filter((p) => p.tier === 'CLOUD_SYNC').sort((a, b) => (CYCLE_ORDER[a.billingCycle] ?? 99) - (CYCLE_ORDER[b.billingCycle] ?? 99));
  const cards = [...plans.filter((p) => p.tier !== 'CLOUD_SYNC').map((plan) => ({ kind: 'single', plan })),
    ...(cloudPlans.length ? [{ kind: 'cloud', plans: cloudPlans }] : [])];
  const currentPlanCode = entitlement?.planCode;
  const selectedTint = colors.brand.accentLight + (mode === 'dark' ? '29' : '1A');
  const selectedPlan = plans.find((p) => p.code === selectedCode);

  async function handlePurchase(plan) {
    if (!plan || plan.tier === 'FREE_TRIAL') return;
    setBusy(true);
    setMessage(null);
    let storePurchaseCompleted = false;
    try {
      const result = offering || (await refetchOffering()).data;
      const pkg = packageFor(result, plan);
      if (!pkg) {
        setMessage({ text: t('subscription.plans.planUnavailable'), tone: 'warning' });
        return;
      }
      await purchasePackage(pkg, adminId);
      storePurchaseCompleted = true;
      const confirmed = await verifyRevenueCatEntitlement(queryClient);
      if (confirmed.planCode !== plan.code || !confirmed.canWrite) {
        setMessage({ text: t('subscription.plans.verificationPending'), tone: 'warning' });
        return;
      }
      showToast(t('subscription.plans.subscriptionUpdated'), 'success');
    } catch (err) {
      if (err?.userCancelled) return;
      setMessage({ text: t(storePurchaseCompleted ? 'subscription.plans.verificationPending' : 'subscription.plans.purchaseFailed'),
        tone: storePurchaseCompleted ? 'warning' : 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    setMessage(null);
    let storeRestoreCompleted = false;
    try {
      await restorePurchases(adminId);
      storeRestoreCompleted = true;
      const confirmed = await verifyRevenueCatEntitlement(queryClient);
      if (confirmed.tier === 'FREE_TRIAL' || !confirmed.canWrite) {
        setMessage({ text: t('subscription.plans.noPurchasesFound'), tone: 'warning' });
        return;
      }
      showToast(t('subscription.plans.purchasesRestored'), 'success');
    } catch (err) {
      setMessage({ text: t(storeRestoreCompleted ? 'subscription.plans.verificationPending' : 'subscription.plans.restoreFailed'),
        tone: storeRestoreCompleted ? 'warning' : 'danger' });
    } finally {
      setBusy(false);
    }
  }

  function handleManage() {
    const url = Platform.OS === 'ios' ? 'itms-apps://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => {});
  }

  function featureRows(plan) {
    return <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
      {planFeatures(plan, t, lang).map((feature, index) => <View key={`${index}-${feature}`} style={{ flexDirection: rowDirection, alignItems: 'flex-start', gap: spacing.sm }}>
        <Check size={16} color={colors.semantic.success} style={{ marginTop: 2 }} />
        <Text style={[typography.body, { color: colors.ink.secondary, flex: 1, textAlign }]}>{feature}</Text>
      </View>)}
    </View>;
  }

  function priceFor(plan) {
    if (plan.tier === 'FREE_TRIAL') return t('subscription.plans.free');
    return packageFor(offering, plan)?.product?.priceString || t('subscription.plans.priceUnavailable');
  }

  return <AnimatedScreen><SafeAreaView style={{ flex: 1 }}>
    <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign }]}>{t('subscription.plans.title')}</Text>
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      {entitlement?.planCode ? <Card style={{ backgroundColor: colors.brand.accentLight }}>
        <Text style={[typography.label, { color: colors.brand.accentDark, textAlign }]}>{t('subscription.plans.currentPlan')}</Text>
        <Text style={[typography.h3, { color: colors.ink.primary, marginTop: spacing.xs, textAlign }]}>
          {plans.find((p) => p.code === currentPlanCode)?.name || entitlement.planName || currentPlanCode}
        </Text>
        <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>
          {entitlement.expiryDate ? timeRemaining(entitlement.expiryDate, now, t) : t('subscription.plans.lifetimeAccess')}
        </Text>
        {entitlement.expiryDate ? <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>
          {t('subscription.plans.endsOn').replace('{date}', new Date(entitlement.expiryDate).toLocaleDateString())}
        </Text> : null}
      </Card> : null}
      {plansLoading ? <ActivityIndicator color={colors.brand.primary} /> : null}
      {plansError ? <Text style={[typography.body, { color: colors.semantic.danger, textAlign }]}>{t('subscription.plans.catalogUnavailable')}</Text> : null}
      {cards.map((card) => {
        const plan = card.plan || card.plans[0];
        const isCloud = card.kind === 'cloud';
        const isCurrent = isCloud ? card.plans.some((p) => p.code === currentPlanCode) : plan.code === currentPlanCode;
        const selected = isCloud ? card.plans.some((p) => p.code === selectedCode) : plan.code === selectedCode;
        return <Card key={isCloud ? 'cloud' : plan.code} level={selected ? 'md' : 'sm'}
          onPress={isCloud ? undefined : () => setSelectedCode(plan.code)}
          style={{ borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brand.accentDark : colors.surface.border,
            backgroundColor: selected ? selectedTint : colors.surface.raised }}>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
            {plan.cloudEnabled ? <Crown size={20} color={colors.brand.accentDark} /> : null}
            <Text style={[typography.h3, { color: colors.ink.primary, flex: 1, textAlign }]}>{isCloud ? t('subscription.plans.cloudTitle') : plan.name}</Text>
            {isCurrent ? <Badge label={t('subscription.plans.currentPlan')} tone="success" /> : null}
          </View>
          {plan.description ? <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>{plan.description}</Text> : null}
          {featureRows(plan)}
          {isCloud ? <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {card.plans.map((variant) => {
              const variantSelected = selectedCode === variant.code;
              const variantCurrent = currentPlanCode === variant.code;
              return <Pressable key={variant.code} onPress={() => setSelectedCode(variant.code)}
                style={{ padding: spacing.md, borderRadius: radii.md, borderWidth: variantSelected ? 2 : 1,
                  borderColor: variantSelected ? colors.brand.accentDark : colors.surface.border,
                  backgroundColor: variantSelected ? selectedTint : colors.surface.card }}>
                <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.label, { color: colors.ink.primary, textAlign }]}>{t(`subscription.plans.cycle.${variant.billingCycle}`)}</Text>
                    {variantCurrent ? <Text style={[typography.caption, { color: colors.semantic.success, textAlign }]}>{t('subscription.plans.currentPlan')}</Text> : null}
                  </View>
                  <Text style={[typography.h3, { color: colors.brand.accentDark }]}>{priceFor(variant)}</Text>
                </View>
                {Array.isArray(variant.features) && JSON.stringify(variant.features) !== JSON.stringify(plan.features) ? featureRows(variant) : null}
              </Pressable>;
            })}
          </View> : <Text style={[typography.h2, { color: colors.brand.accentDark, marginTop: spacing.md, textAlign }]}>{priceFor(plan)}</Text>}
        </Card>;
      })}
      {!offeringLoading && (offeringError || !offering?.availablePackages?.length) ?
        <Text style={[typography.caption, { color: colors.semantic.warning, textAlign }]}>{t('subscription.plans.storeUnavailable')}</Text> : null}
      <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', marginTop: spacing.sm }}>
        <Pressable onPress={handleManage} style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6 }} hitSlop={8}>
          <Settings2 size={14} color={colors.brand.accentDark} />
          <Text style={[typography.label, { color: colors.brand.accentDark }]}>{t('subscription.plans.manageSubscription')}</Text>
        </Pressable>
        <Pressable onPress={handleRestore} disabled={busy} style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6 }} hitSlop={8}>
          <RotateCcw size={14} color={colors.ink.secondary} />
          <Text style={[typography.label, { color: colors.ink.secondary }]}>{t('subscription.plans.restorePurchases')}</Text>
        </Pressable>
      </View>
      {message ? <View style={{ flexDirection: rowDirection, gap: spacing.sm, borderRadius: radii.md, padding: spacing.sm,
        backgroundColor: message.tone === 'danger' ? colors.semantic.dangerBg : colors.semantic.warningBg }}>
        <AlertCircle size={16} color={message.tone === 'danger' ? colors.semantic.danger : colors.semantic.warning} />
        <Text style={[typography.caption, { color: message.tone === 'danger' ? colors.semantic.danger : colors.semantic.warning, flex: 1, textAlign }]}>{message.text}</Text>
      </View> : null}
    </ScrollView>
    <View style={{ padding: spacing.lg }}>
      <Button title={t('subscription.plans.continueButton')} loading={busy} onPress={() => handlePurchase(selectedPlan)}
        disabled={!selectedPlan || selectedPlan.code === currentPlanCode || selectedPlan.tier === 'FREE_TRIAL' || !packageFor(offering, selectedPlan)} />
    </View>
  </SafeAreaView></AnimatedScreen>;
}
