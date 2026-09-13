import { formatCurrency } from './money';
import { t } from '../store/languageStore';

// Minimal receipt HTML used by expo-print for both the Print and Share
// actions on Bill Detail — kept in one place since both call sites need it.
// Uses the imperative `t()` helper (see languageStore.js) so the generated
// receipt's labels respect the app's active language, same reasoning as
// utils/dates.js's formatRelativeTime — otherwise a shop owner using the app
// in Urdu/Hindi would still get an English-only printed/shared receipt.
export function buildReceiptHtml({ shopName, bill }) {
  const itemsHtml = (bill.items || [])
    .map((item) => {
      const qty = item.quantity ?? item.totalArea ?? item.lengthCm ?? item.packQuantity ?? '';
      return `<tr><td>${escapeHtml(item.productName)} × ${qty}</td><td style="text-align:right">${formatCurrency(item.total)}</td></tr>`;
    })
    .join('');

  return `
    <html>
      <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;color:#232733;">
        <div style="text-align:center;">
          <h2 style="margin:0;">${escapeHtml(shopName || 'AsaanKhata')}</h2>
          <p style="color:#6B7280;font-size:12px;">${new Date(bill.createdAt).toLocaleString()} · #${bill.serverId || bill.id}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          ${itemsHtml}
        </table>
        <hr style="border:none;border-top:1px dashed #DEDAD0;margin:12px 0;" />
        <table style="width:100%;font-size:14px;">
          <tr><td>${t('billing.subtotal')}</td><td style="text-align:right">${formatCurrency(bill.subtotal)}</td></tr>
          <tr><td>${t('billing.billDetail.discount')}</td><td style="text-align:right">-${formatCurrency(bill.discount)}</td></tr>
          <tr style="font-weight:bold;font-size:16px;"><td>${t('billing.total')}</td><td style="text-align:right">${formatCurrency(bill.totalAmount)}</td></tr>
        </table>
        <p style="text-align:center;margin-top:16px;font-weight:bold;color:${bill.status === 'PAID' ? '#2E9E6B' : '#C6982F'};">
          ${bill.status === 'PAID' ? t('billing.billDetail.paid') : t('billing.billDetail.pendingDue').replace('{amount}', formatCurrency(bill.remainingDue))}
        </p>
      </body>
    </html>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
