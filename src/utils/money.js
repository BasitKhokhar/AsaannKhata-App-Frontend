// Backend currency is PKR by default (see SubscriptionPlan.currency) and all
// design mockups use "Rs" formatting with thousands separators, no decimals
// for whole-rupee amounts.
export function formatCurrency(amount, currency = 'Rs') {
  const value = Number(amount) || 0;
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}
