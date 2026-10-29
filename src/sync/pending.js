import { categoryRepository } from '../db/repositories/categoryRepository';
import { productRepository } from '../db/repositories/productRepository';
import { customerRepository } from '../db/repositories/customerRepository';
import { billRepository } from '../db/repositories/billRepository';
import { stockRepository } from '../db/repositories/stockRepository';
import { customerPaymentRepository } from '../db/repositories/customerPaymentRepository';
import { expenseRepository } from '../db/repositories/expenseRepository';

const syncRepositories = [
  categoryRepository,
  productRepository,
  stockRepository,
  customerRepository,
  billRepository,
  customerPaymentRepository,
  expenseRepository,
];

export function countPendingSyncRows(shopIds) {
  const ids = (Array.isArray(shopIds) ? shopIds : [shopIds]).filter(Boolean);
  return ids.reduce(
    (shopTotal, shopId) => shopTotal + syncRepositories.reduce(
      (total, repository) => total + repository.listPending(String(shopId)).length,
      0
    ),
    0
  );
}
