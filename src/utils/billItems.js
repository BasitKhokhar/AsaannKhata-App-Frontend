const rounded = (value, digits = 3) => Number(Number(value || 0).toFixed(digits));

export function formatBillItemQuantity(item, t) {
  switch (item.stockType) {
    case 'AREA':
      if (item.width && item.height) {
        return `${rounded(item.width)} × ${rounded(item.height)} ${item.unit || 'cm'} · ${rounded(item.quantity)} ${t('billing.pieces')}`;
      }
      return `${rounded(item.totalArea, 2)} cm²`;
    case 'LENGTH':
      return `${rounded((item.lengthCm || 0) / 100)} ${t('billing.meters')}`;
    case 'PACK':
      return `${rounded(item.packQuantity)} ${t('receipt.packs')} + ${rounded(item.looseQuantity)} ${t('receipt.units')}`;
    case 'LIQUID':
      return item.unit === 'ml' ? `${rounded(item.quantity)} mL` : `${rounded(item.quantity)} L`;
    default:
      return `${rounded(item.quantity)} ${t('receipt.units')}`;
  }
}
