import { and, eq } from 'drizzle-orm';
import { db, expoDb } from '../client';
import { bills, customerPayments } from '../schema';
import { customerRepository } from './customerRepository';
import { customerPaymentRepository } from './customerPaymentRepository';

// The current server sync contract preserves customer-payment notes but has no
// billId field. Keep this marker stable so another device can rebuild the
// same bill timeline after pulling its customer payments.
const BILL_NOTE_PREFIX = 'asaankhata:bill:';
const cents = (value) => Math.round((Number(value) || 0) * 100);

export function billIdFromPayment(payment) {
  return payment.note?.startsWith(BILL_NOTE_PREFIX)
    ? payment.note.slice(BILL_NOTE_PREFIX.length).split('|')[0]
    : null;
}

export function paymentTime(payment) {
  const timestamp = payment.note?.startsWith(BILL_NOTE_PREFIX) ? payment.note.split('|')[1] : null;
  return timestamp && !Number.isNaN(Date.parse(timestamp)) ? timestamp : payment.createdAt;
}

function paymentKeys(bill) {
  return new Set([bill.id, ...(bill.serverId ? [String(bill.serverId)] : [])]);
}

export function paymentsForBill(bill) {
  const keys = paymentKeys(bill);
  return db.select().from(customerPayments)
    .where(eq(customerPayments.shopId, bill.shopId))
    .all()
    .filter((payment) => keys.has(billIdFromPayment(payment)))
    .sort((a, b) => new Date(paymentTime(a)) - new Date(paymentTime(b)));
}

export function settledBill(bill, payments = paymentsForBill(bill)) {
  const originalDue = cents(bill.remainingDue);
  const laterPaid = payments.reduce((sum, payment) => sum + cents(payment.amount), 0);
  const remainingDue = Math.max(0, originalDue - laterPaid) / 100;
  return {
    ...bill,
    totalReceived: (cents(bill.totalReceived) + laterPaid) / 100,
    remainingDue,
    status: remainingDue <= 0 ? 'PAID' : 'PENDING',
    payments,
  };
}

export function listSettledBills(shopId) {
  const rows = db.select().from(bills)
    .where(and(eq(bills.shopId, shopId), eq(bills.isDeleted, false)))
    .all()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const grouped = new Map();
  for (const payment of customerPaymentRepository.listByShop(shopId)) {
    const billId = billIdFromPayment(payment);
    if (!billId) continue;
    const entries = grouped.get(billId) || [];
    entries.push(payment);
    grouped.set(billId, entries);
  }
  return rows.map((bill) => settledBill(bill, [
    ...(grouped.get(bill.id) || []),
    ...(bill.serverId ? grouped.get(String(bill.serverId)) || [] : []),
  ].sort((a, b) => new Date(paymentTime(a)) - new Date(paymentTime(b)))));
}

export function recordBillPayment({ billId, shopId, amount }) {
  const input = String(amount).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) throw new Error('records.error.invalidAmount');
  const amountCents = Math.round(Number(input) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('records.error.invalidAmount');
  let saved;
  expoDb.withTransactionSync(() => {
    const bill = db.select().from(bills)
      .where(and(eq(bills.id, billId), eq(bills.shopId, shopId), eq(bills.isDeleted, false)))
      .get();
    if (!bill || !bill.customerId) throw new Error('records.error.customerRequired');
    const customer = customerRepository.getById(bill.customerId);
    if (!customer || customer.shopId !== shopId || customer.isDeleted) throw new Error('records.error.customerRequired');
    if (amountCents > cents(settledBill(bill).remainingDue)) throw new Error('records.error.overBill');
    if (amountCents > cents(customer.balance)) throw new Error('records.error.overAccount');
    const paidAt = new Date().toISOString();
    saved = customerPaymentRepository.create({
      shopId,
      customerId: bill.customerId,
      amount: amountCents / 100,
      note: `${BILL_NOTE_PREFIX}${bill.serverId || bill.id}|${paidAt}`,
      createdAt: paidAt,
    });
    customerRepository.adjustBalance(bill.customerId, -amountCents / 100);
  });
  return saved;
}
