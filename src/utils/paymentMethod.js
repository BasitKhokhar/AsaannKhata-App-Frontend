const labels = {
  CASH: 'billing.payment.cash',
  CARD: 'billing.payment.card',
  MOBILE_WALLET: 'billing.payment.wallet',
  CREDIT: 'billing.payment.credit',
};

export function paymentMethodLabelKey(method) {
  return labels[method] || 'billing.payment.unspecified';
}
