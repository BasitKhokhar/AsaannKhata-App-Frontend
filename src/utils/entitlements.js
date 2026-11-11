const FREE_PLAN_NAMES = new Set(['FREE', 'FREE_TRIAL']);

function normalized(value) {
  return String(value || '').trim().toUpperCase();
}

// Ad eligibility is deliberately based on the purchased tier, not
// cloudEnabled. Lifetime Offline is a paid, ad-free plan even though it does
// not include cloud features.
export function isAdSupportedEntitlement(entitlement) {
  if (!entitlement) return false;

  const tier = normalized(entitlement.tier);
  const planCode = normalized(entitlement.planCode);
  const isFreePlan = FREE_PLAN_NAMES.has(tier) || FREE_PLAN_NAMES.has(planCode) || planCode.startsWith('FREE_');

  // An expired paid entitlement falls back to the ad-supported experience.
  return isFreePlan || entitlement.canWrite === false || normalized(entitlement.status) === 'EXPIRED';
}

export function isFreeEntitlement(entitlement) {
  if (!entitlement) return false;
  const tier = normalized(entitlement.tier);
  const planCode = normalized(entitlement.planCode);
  return FREE_PLAN_NAMES.has(tier) || FREE_PLAN_NAMES.has(planCode) || planCode.startsWith('FREE_');
}

export function hasSyncEntitlement(entitlement) {
  return !!entitlement?.cloudEnabled || isFreeEntitlement(entitlement);
}

export function isAdFreeEntitlement(entitlement) {
  return !!entitlement && !isAdSupportedEntitlement(entitlement);
}
