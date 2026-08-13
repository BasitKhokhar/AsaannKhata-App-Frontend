// Human-readable stock line + mode badge for product rows, matching the
// design's "6 units left" / "142.5 ft² in stock" / "3 packs + 8 loose" style.
export function formatStockLabel(product) {
  switch (product.stockType) {
    case 'AREA': {
      const ft2 = (product.stockAreaCm2 || 0) / 929.03; // cm² -> ft²
      return `${round(ft2)} ft² in stock`;
    }
    case 'LENGTH':
      return `${round((product.stockLengthCm || 0) / 100)} m in stock`;
    case 'PACK':
      return `${round(product.stockPacks || 0)} packs + ${round(product.stockLooseUnits || 0)} loose`;
    default:
      return `${round(product.stockQuantity || 0)} units left`;
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
