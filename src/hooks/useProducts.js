import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productRepository } from '../db/repositories/productRepository';
import { stockRepository } from '../db/repositories/stockRepository';
import { expoDb } from '../db/client';
import { useShopStore } from '../store/shopStore';
import { convertToCm, calculateAreaCm2, getAreaConversionFactor, getLengthConversionFactor } from '../utils/unitConverter';

// Mirrors Backend/controllers/productsController.js's createProduct exactly —
// raw human-entered values (sheetWidth/sheetHeight/quantity/unit) come in,
// cm-normalized fields go into local SQLite, so a later sync push sends the
// same shape the backend would have produced from this same form.
function normalizeProductFields(raw) {
  const stockType = raw.stockType;
  const purchasePrice = parseFloat(raw.purchasePrice) || 0;
  const salePrice = parseFloat(raw.salePrice) || 0;
  const data = { name: raw.name, categoryId: raw.categoryId || null, image: raw.image || null, stockType, purchasePrice, salePrice, lowStockThreshold: raw.lowStockThreshold != null ? parseFloat(raw.lowStockThreshold) : null };

  if (stockType === 'AREA') {
    const areaCm2 = calculateAreaCm2(parseFloat(raw.sheetWidth), parseFloat(raw.sheetHeight), raw.unit);
    const areaFactor = getAreaConversionFactor(raw.unit);
    const quantity = parseFloat(raw.quantity) || 0;
    data.sheetWidthCm = convertToCm(parseFloat(raw.sheetWidth), raw.unit);
    data.sheetHeightCm = convertToCm(parseFloat(raw.sheetHeight), raw.unit);
    data.sheetAreaCm2 = areaCm2;
    data.stockAreaCm2 = areaCm2 * quantity;
    if (areaFactor > 1) {
      data.purchasePrice = purchasePrice / areaFactor;
      data.salePrice = salePrice / areaFactor;
    }
  } else if (stockType === 'LENGTH') {
    const lengthFactor = getLengthConversionFactor(raw.unit);
    data.stockLengthCm = convertToCm(parseFloat(raw.quantity) || 0, raw.unit);
    if (lengthFactor > 1) {
      data.purchasePrice = purchasePrice / lengthFactor;
      data.salePrice = salePrice / lengthFactor;
    }
  } else if (stockType === 'PACK') {
    data.packSize = parseInt(raw.packSize, 10) || null;
    data.stockPacks = parseFloat(raw.stockPacks) || 0;
    data.stockLooseUnits = parseFloat(raw.stockLooseUnits) || 0;
    data.packPurchasePrice = raw.packPurchasePrice ? parseFloat(raw.packPurchasePrice) : null;
    data.packSalePrice = raw.packSalePrice ? parseFloat(raw.packSalePrice) : null;
  } else {
    data.stockQuantity = parseFloat(raw.quantity) || 0;
  }

  return data;
}

export function useProducts({ search, categoryId } = {}) {
  const activeShopId = useShopStore((s) => s.activeShopId);
  const query = useQuery({
    queryKey: ['products', activeShopId],
    queryFn: () => productRepository.listByShop(activeShopId),
    enabled: !!activeShopId,
  });

  const filtered = useMemo(() => {
    let rows = query.data || [];
    if (categoryId) rows = rows.filter((p) => p.categoryId === categoryId);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    }
    return rows;
  }, [query.data, search, categoryId]);

  return { ...query, data: filtered };
}

export function useProduct(productId) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => productRepository.getById(productId),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);

  return {
    mutate: (rawFields, options) => {
      try {
        const normalized = normalizeProductFields(rawFields);
        let product;
        expoDb.withTransactionSync(() => {
          product = productRepository.create({ ...normalized, shopId: activeShopId });
          const initialQty = initialStockQuantityFor(product);
          if (initialQty > 0) {
            stockRepository.create({
              shopId: activeShopId,
              productId: product.id,
              type: 'IN',
              quantity: initialQty,
              price: normalized.purchasePrice,
              description: 'Initial stock',
            });
          }
        });

        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        options?.onSuccess?.(product);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);
  return {
    mutate: (id, fields, options) => {
      try {
        const product = productRepository.update(id, fields);
        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        options?.onSuccess?.(product);
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  const activeShopId = useShopStore((s) => s.activeShopId);

  return {
    mutate: ({ productId, type, quantity, price, description }, options) => {
      try {
        const product = productRepository.getById(productId);
        const signedQty = type === 'OUT' ? -Math.abs(quantity) : Math.abs(quantity);

        expoDb.withTransactionSync(() => {
          if (type === 'PACK_BREAK') {
            productRepository.adjustStock(productId, {
              stockPacks: Math.max(0, (product.stockPacks || 0) - quantity),
              stockLooseUnits: (product.stockLooseUnits || 0) + quantity * (product.packSize || 1),
            });
          } else {
            const patch = patchForStockType(product, signedQty);
            productRepository.adjustStock(productId, patch);
          }
          stockRepository.create({ shopId: activeShopId, productId, type, quantity, price, description });
        });

        queryClient.invalidateQueries({ queryKey: ['products', activeShopId] });
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
        options?.onSuccess?.();
      } catch (err) {
        options?.onError?.(err);
      }
    },
  };
}

function initialStockQuantityFor(product) {
  switch (product.stockType) {
    case 'AREA':
      return product.stockAreaCm2 || 0;
    case 'LENGTH':
      return product.stockLengthCm || 0;
    case 'PACK':
      return (product.stockPacks || 0) * (product.packSize || 1) + (product.stockLooseUnits || 0);
    default:
      return product.stockQuantity || 0;
  }
}

function patchForStockType(product, signedQty) {
  switch (product.stockType) {
    case 'AREA':
      return { stockAreaCm2: Math.max(0, (product.stockAreaCm2 || 0) + signedQty) };
    case 'LENGTH':
      return { stockLengthCm: Math.max(0, (product.stockLengthCm || 0) + signedQty) };
    case 'PACK':
      return { stockPacks: Math.max(0, (product.stockPacks || 0) + signedQty) };
    default:
      return { stockQuantity: Math.max(0, (product.stockQuantity || 0) + signedQty) };
  }
}
