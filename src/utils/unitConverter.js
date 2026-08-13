// Mirrors Backend/utils/unitConverter.js exactly — local product writes must
// normalize to the same per-cm²/per-cm basis the backend uses, since the
// sync engine pushes these fields as-is (no server-side re-conversion).
const CM_PER_INCH = 2.54;
const CM_PER_FOOT = 30.48;
const CM_PER_METER = 100;

export function convertToCm(value, unit) {
  switch (unit) {
    case 'inch':
      return value * CM_PER_INCH;
    case 'feet':
      return value * CM_PER_FOOT;
    case 'meter':
      return value * CM_PER_METER;
    case 'cm':
    default:
      return value;
  }
}

export function calculateAreaCm2(width, height, unit) {
  return convertToCm(width, unit) * convertToCm(height, unit);
}

export function getAreaConversionFactor(unit) {
  const oneUnitInCm = convertToCm(1, unit);
  return oneUnitInCm * oneUnitInCm;
}

export function getLengthConversionFactor(unit) {
  return convertToCm(1, unit);
}
