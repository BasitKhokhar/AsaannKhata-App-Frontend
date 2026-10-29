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

function suppliedFeatures(plan) {
  if (Array.isArray(plan.features)) return plan.features;
  if (typeof plan.features !== 'string') return [];
  try {
    const parsed = JSON.parse(plan.features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function planFeatures(plan, t, lang) {
  const supplied = suppliedFeatures(plan);
  const features = supplied.map((item) => typeof item === 'string' ? item
    : item?.[lang] || item?.en || item?.text || item?.label || item?.title).filter((item) => typeof item === 'string' && item.trim());
  if (features.length) return features;
  return [
    plan.cloudEnabled ? t('subscription.plans.cloudSyncFeature') : t('subscription.plans.offlineFeature'),
    t('subscription.plans.maxDevices').replace('{count}', plan.maxDevices),
  ];
}

function planFamily(plan) {
  return String(plan.code || plan.revenueCatProductId || plan.name)
    .replace(/_(MONTHLY|SEMIANNUAL|YEARLY)$/i, '')
    .replace(/:(monthly|six-month|semiannual|yearly)$/i, '');
}

function buildPlanCards(plans) {
  const cards = plans.filter((plan) => plan.tier !== 'CLOUD_SYNC').map((plan) => ({ kind: 'single', key: plan.code, plan }));
  const groups = new Map();
  plans.filter((plan) => plan.tier === 'CLOUD_SYNC').forEach((plan) => {
    const key = planFamily(plan);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(plan);
  });
  groups.forEach((groupPlans, key) => {
    groupPlans.sort((a, b) => (CYCLE_ORDER[a.billingCycle] ?? 99) - (CYCLE_ORDER[b.billingCycle] ?? 99));
    cards.push({ kind: 'cloud', key, plans: groupPlans });
  });
  return cards.sort((a, b) => {
    const firstA = a.plan || a.plans[0];
    const firstB = b.plan || b.plans[0];
    return (firstA.sortOrder ?? 0) - (firstB.sortOrder ?? 0);
  });
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
  const [selectedCodes, setSelectedCodes] = useState({});
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
  const cards = buildPlanCards(plans);
  const currentPlanCode = entitlement?.planCode;
  const selectedTint = colors.brand.accentLight + (mode === 'dark' ? '29' : '1A');

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
        const selectedVariant = isCloud
          ? card.plans.find((p) => p.code === selectedCodes[card.key]) || card.plans.find((p) => p.code === currentPlanCode) || card.plans[0]
          : plan;
        const isCurrent = isCloud ? card.plans.some((p) => p.code === currentPlanCode) : plan.code === currentPlanCode;
        const recommended = isCloud && /(^|_)PRO($|_)/i.test(card.key);
        const purchasable = selectedVariant.tier !== 'FREE_TRIAL' && !!packageFor(offering, selectedVariant);
        return <Card key={card.key} level={recommended ? 'md' : 'sm'} style={{ padding: 0, overflow: 'hidden', borderWidth: isCurrent ? 2 : 1,
          borderColor: isCurrent ? colors.semantic.success : recommended ? colors.brand.accentDark : colors.surface.border }}>
          <View style={{ backgroundColor: recommended ? colors.brand.accentLight : colors.surface.card, padding: spacing.lg }}>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
              {plan.cloudEnabled ? <Crown size={21} color={colors.brand.accentDark} /> : null}
              <Text style={[typography.h2, { color: colors.ink.primary, flex: 1, textAlign }]}>{plan.name}</Text>
              {recommended ? <Badge label={t('subscription.plans.recommended')} tone="warning" /> : null}
              {isCurrent ? <Badge label={t('subscription.plans.currentPlan')} tone="success" /> : null}
            </View>
            {plan.description ? <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.xs, lineHeight: 20, textAlign }]}>{plan.description}</Text> : null}
          </View>

          <View style={{ padding: spacing.lg }}>
            {isCloud ? <View>
              <Text style={[typography.label, { color: colors.ink.secondary, marginBottom: spacing.sm, textAlign }]}>{t('subscription.plans.chooseBillingPeriod')}</Text>
              <View style={{ flexDirection: rowDirection, gap: spacing.xs }}>
                {card.plans.map((variant) => {
                  const active = selectedVariant.code === variant.code;
                  return <Pressable key={variant.code} onPress={() => setSelectedCodes((value) => ({ ...value, [card.key]: variant.code }))} accessibilityRole="radio"
                    accessibilityState={{ checked: active }} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: spacing.xs, borderRadius: radii.md, borderWidth: active ? 2 : 1,
                      borderColor: active ? colors.brand.primary : colors.surface.border,
                      backgroundColor: active ? selectedTint : colors.surface.card }}>
                    <Text numberOfLines={2} style={[typography.label, { color: active ? colors.brand.primary : colors.ink.secondary, textAlign: 'center' }]}>
                      {t(`subscription.plans.cycle.${variant.billingCycle}`)}
                    </Text>
                  </Pressable>;
                })}
              </View>
            </View> : null}

            <View style={{ flexDirection: rowDirection, alignItems: 'baseline', gap: spacing.xs, marginTop: isCloud ? spacing.lg : 0 }}>
              <Text style={[typography.numericLarge, { color: colors.brand.primary, fontSize: 30 }]}>{priceFor(selectedVariant)}</Text>
              {selectedVariant.billingCycle ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {t('subscription.plans.billedCycle').replace('{cycle}', t(`subscription.plans.cycle.${selectedVariant.billingCycle}`).toLocaleLowerCase())}
              </Text> : null}
            </View>

            <View style={{ height: 1, backgroundColor: colors.surface.border, marginVertical: spacing.lg }} />
            {featureRows(selectedVariant)}

            <Button
              title={isCurrent && selectedVariant.code === currentPlanCode ? t('subscription.plans.currentPlan') : t('subscription.plans.subscribeNow')}
              onPress={() => handlePurchase(selectedVariant)}
              loading={busy}
              disabled={!purchasable || selectedVariant.code === currentPlanCode}
              variant={recommended ? 'accent' : 'primary'}
              style={{ marginTop: spacing.lg }}
            />
          </View>
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
  </SafeAreaView></AnimatedScreen>;
}
