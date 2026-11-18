import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Crown, AlertCircle, Settings2, RotateCcw } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
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
const CYCLE_MONTHS = { MONTHLY: 1, SEMIANNUAL: 6, YEARLY: 12 };

function formatStoreAmount(amount, product, lang) {
  if (!Number.isFinite(amount)) return null;
  const locale = lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-PK';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: product?.currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${product?.currencyCode || ''} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim();
  }
}

function recurringPricing(plans, offering, selectedPlan, lang) {
  const selectedProduct = packageFor(offering, selectedPlan)?.product;
  const months = CYCLE_MONTHS[selectedPlan?.billingCycle];
  if (!selectedProduct || !months || !Number.isFinite(selectedProduct.price)) return null;

  const monthlyPlan = plans.find((plan) => plan.billingCycle === 'MONTHLY');
  const monthlyProduct = packageFor(offering, monthlyPlan)?.product;
  const effectiveMonthly = selectedProduct.price / months;
  const baselineTotal = Number.isFinite(monthlyProduct?.price) ? monthlyProduct.price * months : null;
  const savingsPercent = baselineTotal > 0 && selectedProduct.price < baselineTotal
    ? Math.round((1 - selectedProduct.price / baselineTotal) * 100)
    : 0;

  return {
    total: formatStoreAmount(selectedProduct.price, selectedProduct, lang) || selectedProduct.priceString,
    effectiveMonthly: formatStoreAmount(effectiveMonthly, selectedProduct, lang)
      || selectedProduct.pricePerMonthString,
    regularMonthly: monthlyProduct
      ? formatStoreAmount(monthlyProduct.price, monthlyProduct, lang) || monthlyProduct.priceString
      : null,
    savingsPercent,
  };
}

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

function isFreePlan(plan) {
  return ['FREE', 'FREE_TRIAL'].includes(plan.tier) || /^FREE(?:_|$)/i.test(plan.code || '');
}

function buildPlanCards(plans) {
  const paidPlans = plans.filter((plan) => !isFreePlan(plan));
  const cards = paidPlans
    .filter((plan) => plan.tier !== 'CLOUD_SYNC')
    .map((plan) => ({ kind: 'single', key: plan.code, plan }));
  const groups = new Map();
  paidPlans.filter((plan) => plan.tier === 'CLOUD_SYNC').forEach((plan) => {
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
  const { colors, radii, typography, spacing } = useTheme();
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
    const product = packageFor(offering, plan)?.product;
    if (!product) return t('subscription.plans.priceUnavailable');
    return formatStoreAmount(product.price, product, lang) || product.priceString;
  }

  return <AnimatedScreen><SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Header title={t('subscription.plans.title')} />
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      {entitlement?.planCode ? <Card bordered={false} level="md" style={{ backgroundColor: colors.brand.primaryDark }}>
        <Text style={[typography.label, { color: colors.ink.onBrand, opacity: 0.72, textAlign }]}>{t('subscription.plans.currentPlan')}</Text>
        <Text style={[typography.h3, { color: colors.ink.onBrand, marginTop: spacing.xs, textAlign }]}>
          {plans.find((p) => p.code === currentPlanCode)?.name || entitlement.planName || currentPlanCode}
        </Text>
        <Text style={[typography.body, { color: colors.ink.onBrand, opacity: 0.82, marginTop: spacing.xs, textAlign }]}>
          {entitlement.expiryDate ? timeRemaining(entitlement.expiryDate, now, t) : t('subscription.plans.lifetimeAccess')}
        </Text>
        {entitlement.expiryDate ? <Text style={[typography.caption, { color: colors.ink.onBrand, opacity: 0.72, marginTop: spacing.xs, textAlign }]}>
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
        const selectedPricing = isCloud ? recurringPricing(card.plans, offering, selectedVariant, lang) : null;
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
              <View style={{ flexDirection: rowDirection, marginTop: 5, padding: 3, minHeight: 50, borderRadius: radii.md,
                borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.card }}>
                {card.plans.map((variant, index) => {
                  const active = selectedVariant.code === variant.code;
                  const variantPricing = recurringPricing(card.plans, offering, variant, lang);
                  const savingsPercent = variantPricing?.savingsPercent || 0;
                  const hasDivider = index > 0;
                  return <Pressable key={variant.code} onPress={() => setSelectedCodes((value) => ({ ...value, [card.key]: variant.code }))} accessibilityRole="radio"
                    accessibilityLabel={`${t(`subscription.plans.cycle.${variant.billingCycle}`)}${savingsPercent ? `, ${t('subscription.plans.savePercent').replace('{percent}', savingsPercent)}` : ''}`}
                    accessibilityState={{ checked: active }} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: spacing.xs, borderRadius: radii.sm,
                      ...(hasDivider && !active ? (isUrdu ? { borderRightWidth: 1 } : { borderLeftWidth: 1 }) : {}),
                      borderColor: colors.surface.border,
                      backgroundColor: active ? colors.brand.primary : 'transparent' }}>
                    {savingsPercent ? <View style={{ position: 'absolute', top: -12, zIndex: 2, borderRadius: radii.pill,
                      paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.semantic.successBg,
                      borderWidth: 2, borderColor: colors.surface.raised }}>
                      <Text style={[typography.label, { color: colors.semantic.success, fontSize: 9, lineHeight: 11 }]}>
                        {t('subscription.plans.savePercent').replace('{percent}', savingsPercent)}
                      </Text>
                    </View> : null}
                    <Text numberOfLines={1} style={[typography.label, { color: active ? colors.ink.onBrand : colors.ink.secondary,
                      fontSize: active ? 13 : 12, textAlign: 'center' }]}>
                      {t(`subscription.plans.cycle.${variant.billingCycle}`)}
                    </Text>
                  </Pressable>;
                })}
              </View>
            </View> : null}

            {selectedPricing ? <View style={{ marginTop: isCloud ? spacing.lg : 0 }}>
              <Text style={[typography.label, { color: colors.ink.secondary, textAlign }]}>{t('subscription.plans.effectiveMonthlyPrice')}</Text>
              <View style={{ flexDirection: rowDirection, alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 }}>
                <Text style={[typography.numericLarge, { color: colors.brand.primary, fontSize: 30 }]}>{selectedPricing.effectiveMonthly}</Text>
                <Text style={[typography.bodyMedium, { color: colors.ink.secondary }]}>{t('subscription.plans.perMonth')}</Text>
              </View>
              {selectedPricing.savingsPercent && selectedPricing.regularMonthly ? <View style={{ flexDirection: rowDirection, alignItems: 'center',
                flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('subscription.plans.regularMonthlyPrice')}</Text>
                <Text style={[typography.caption, { color: colors.ink.secondary, textDecorationLine: 'line-through' }]}>{selectedPricing.regularMonthly}</Text>
                <Badge label={t('subscription.plans.savePercent').replace('{percent}', selectedPricing.savingsPercent)} tone="success" />
              </View> : null}
              <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md,
                marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface.card,
                borderWidth: 1, borderColor: colors.surface.border }}>
                <Text style={[typography.bodyMedium, { color: colors.ink.secondary, flex: 1, textAlign }]}>
                  {t('subscription.plans.termTotal').replace('{cycle}', t(`subscription.plans.cycle.${selectedVariant.billingCycle}`))}
                </Text>
                <Text style={[typography.numeric, { color: colors.ink.primary }]}>{selectedPricing.total}</Text>
              </View>
            </View> : <View style={{ flexDirection: rowDirection, alignItems: 'baseline', gap: spacing.xs, marginTop: isCloud ? spacing.lg : 0 }}>
              <Text style={[typography.numericLarge, { color: colors.brand.primary, fontSize: 30 }]}>{priceFor(selectedVariant)}</Text>
              {selectedVariant.billingCycle ? <Text style={[typography.caption, { color: colors.ink.secondary }]}>
                {t('subscription.plans.billedCycle').replace('{cycle}', t(`subscription.plans.cycle.${selectedVariant.billingCycle}`).toLocaleLowerCase())}
              </Text> : null}
            </View>}

            <View style={{ height: 1, backgroundColor: colors.surface.border, marginVertical: spacing.lg }} />
            {featureRows(selectedVariant)}

            <Button
              title={isCurrent && selectedVariant.code === currentPlanCode ? t('subscription.plans.currentPlan') : t('subscription.plans.subscribeNow')}
              onPress={() => handlePurchase(selectedVariant)}
              loading={busy}
              disabled={!purchasable || selectedVariant.code === currentPlanCode}
              variant={recommended ? 'accent' : 'primary'}
              foregroundColor={recommended ? colors.ink.inverse : undefined}
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
