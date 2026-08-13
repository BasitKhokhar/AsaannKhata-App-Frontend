import { customerPayments } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';

export const customerPaymentRepository = createSyncableRepository(customerPayments, { appendOnly: true });
