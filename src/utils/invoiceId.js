// A bill can have a numeric backend ID after sync or only its UUID while it
// is offline. Keep the user-facing invoice identifier a string in both cases.
export function formatInvoiceId(bill) {
  const raw = bill?.serverId !== null && bill?.serverId !== undefined && String(bill.serverId).trim()
    ? bill.serverId
    : bill?.id;
  if (raw === null || raw === undefined || String(raw).trim() === '') return 'INV-UNKNOWN';

  const value = String(raw).trim();
  if (/^\d+$/.test(value)) return `INV-${value.padStart(6, '0')}`;
  return `INV-${value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
}
