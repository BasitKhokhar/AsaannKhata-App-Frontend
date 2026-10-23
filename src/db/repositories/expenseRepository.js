import { createSyncableRepository } from './createSyncableRepository';
import { expenses } from '../schema';

export const expenseRepository = createSyncableRepository(expenses);
