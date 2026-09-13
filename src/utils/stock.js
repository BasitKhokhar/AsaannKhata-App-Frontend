import { t } from '../store/languageStore';

// Human-readable stock line + mode badge for product rows, matching the
// design's "6 units left" / "142.5 ft² in stock" / "3 packs + 8 loose" style.
// Uses the imperative `t()` helper (see languageStore.js) so this plain
// utility's output respects the app's active language, same reasoning as
// utils/dates.js's formatRelativeTime.
export function formatStockLabel(product) {
  switch (product.stockType) {
    case 'AREA': {
      const ft2 = (product.stockAreaCm2 || 0) / 929.03; // cm² -> ft²
      return t('stock.areaInStock').replace('{count}', round(ft2));
    }
    case 'LENGTH':
      return t('stock.lengthInStock').replace('{count}', round((product.stockLengthCm || 0) / 100));
    case 'PACK':
      return t('stock.packInStock').replace('{count}', round(product.stockPacks || 0)).replace('{loose}', round(product.stockLooseUnits || 0));
    default:
      return t('stock.unitsLeft').replace('{count}', round(product.stockQuantity || 0));
  }
}

export function isLowStock(product) {
  if (product.lowStockThreshold == null) return false;
  const value = primaryStockValue(product);
  return value <= product.lowStockThreshold;
}

export function isOutOfStock(product) {
  return primaryStockValue(product) <= 0;
}

function primaryStockValue(product) {
  switch (product.stockType) {
    case 'AREA':
      return product.stockAreaCm2 || 0;
    case 'LENGTH':
      return product.stockLengthCm || 0;
    case 'PACK':
      return (product.stockPacks || 0) + (product.stockLooseUnits || 0);
    default:
      return product.stockQuantity || 0;
  }
}

function round(n) {
  return Math.round(n * 10) / 10;
}
