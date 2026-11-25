const round2 = (value) => Math.round(value * 100) / 100;

export function lineFor(product, amount, unit = 'default', measurements = {}) {
  const quantity = Number(amount);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('barcode.quantity');
  const common = { productId: product.id, productName: product.name, stockType: product.stockType, quantity };
  const priceOverride = measurements.priceOverride != null && Number.isFinite(Number(measurements.priceOverride)) ? Number(measurements.priceOverride) : null;
  if (product.stockType === 'AREA') {
    const width = Number(measurements.width);
    const height = Number(measurements.height);
    const measurementUnit = measurements.unit || 'cm';
    if (!(width > 0) || !(height > 0)) throw new Error('billing.areaMeasurementsRequired');
    const unitArea = areaInCm2(width, height, measurementUnit);
    const totalArea = unitArea * quantity;
    const pricePerUnit = priceOverride ?? product.salePrice;
    return { ...common, unit: measurementUnit, width, height, unitArea, totalArea, pricePerUnit, total: round2(totalArea * pricePerUnit) };
  }
  if (product.stockType === 'LENGTH') {
    const lengthCm = quantity * 100;
    const pricePerUnit = priceOverride ?? product.salePrice;
    return { ...common, unit: 'meter', lengthCm, pricePerUnit, total: round2(lengthCm * pricePerUnit) };
  }
  if (product.stockType === 'PACK') {
    const loose = unit === 'loose';
    const pricePerUnit = priceOverride ?? (loose ? product.salePrice : product.packSalePrice ?? product.salePrice * (product.packSize || 1));
    return { ...common, unit: loose ? 'loose' : 'pack', packQuantity: loose ? 0 : quantity, looseQuantity: loose ? quantity : 0, pricePerUnit, total: round2(quantity * pricePerUnit) };
  }
  if (product.stockType === 'LIQUID') {
    const volumeMl = unit === 'liter' ? quantity * 1000 : quantity;
    const pricePerUnit = priceOverride ?? product.salePrice;
    return { ...common, unit, volumeMl, pricePerUnit, total: round2(volumeMl * pricePerUnit) };
  }
  const pricePerUnit = priceOverride ?? product.salePrice;
  return { ...common, unit: 'piece', pricePerUnit, total: round2(quantity * pricePerUnit) };
}

export function assertCartStock(product, lines, added) {
  const all = [...lines.filter((line) => line.productId === product.id), added];
  const sum = (key) => all.reduce((total, line) => total + (Number(line[key]) || 0), 0);
  const enough = product.stockType === 'AREA' ? sum('totalArea') <= product.stockAreaCm2
    : product.stockType === 'LENGTH' ? sum('lengthCm') <= product.stockLengthCm
    : product.stockType === 'PACK' ? sum('packQuantity') <= product.stockPacks && sum('looseQuantity') <= product.stockLooseUnits
    : product.stockType === 'LIQUID' ? sum('volumeMl') <= product.stockVolumeMl
    : sum('quantity') <= product.stockQuantity;
  if (!enough) throw new Error('billing.quantityExceedsStock');
}

function areaInCm2(width, height, unit) {
  const factor = unit === 'meter' ? 100 : unit === 'feet' ? 30.48 : unit === 'inch' ? 2.54 : 1;
  return width * factor * height * factor;
}
