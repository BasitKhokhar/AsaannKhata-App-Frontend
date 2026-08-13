import { categories } from '../schema';
import { createSyncableRepository } from './createSyncableRepository';

export const categoryRepository = createSyncableRepository(categories);
