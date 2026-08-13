import { eq } from 'drizzle-orm';
import { db } from '../db/client';

// Server rows are keyed by autoincrement int; local rows are keyed by the
// UUID that was sent as `clientId`. Every FK pulled from the server (e.g.
// Product.categoryId, BillItem.productId) needs remapping from that server
// int to the matching local row's UUID before it can be written locally.
export function resolveLocalIdByServerId(table, serverId) {
  if (serverId == null) return null;
  const row = db.select({ id: table.id }).from(table).where(eq(table.serverId, serverId)).get();
  return row?.id ?? null;
}
