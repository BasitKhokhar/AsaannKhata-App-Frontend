import { formatCurrency } from './money';
import { paymentMethodLabelKey } from './paymentMethod';
import { normalizeReceiptConfig } from './receiptConfig';
import { palette } from '../theme/colors';
import { en } from '../i18n/en';
import { ur } from '../i18n/ur';
import { hi } from '../i18n/hi';

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function receiptDimensions(config) {
  return config.paper === 'A4' ? { width: 595, height: 842 } : { width: Number(config.paper) * 72 / 25.4, height: 842 };
}

function quantityLabel(item, t) {
  if (item.stockType === 'LENGTH') return `${Number(((item.lengthCm || 0) / 100).toFixed(3))} ${t('billing.meters')}`;
  if (item.stockType === 'AREA') return `${Number((item.totalArea || 0).toFixed(2))} cm²`;
  if (item.stockType === 'PACK') return `${item.packQuantity || 0} ${t('receipt.packs')} + ${item.looseQuantity || 0} ${t('receipt.units')}`;
  return `${item.quantity || 0} ${t('receipt.units')}`;
}

// One renderer for preview, PDF, and system printing. All owner/customer input
// is escaped. Configuration can change appearance, never financial values.
export function buildReceiptHtml({ shopName, bill, config: input, statement = false, fontData = '' }) {
  const config = normalizeReceiptConfig(input || bill.receiptSnapshot || { displayName: shopName });
  const dictionary = { en, ur, hi }[config.language];
  const t = (key) => dictionary[key] || en[key] || key;
  const e = escapeHtml;
  const money = (value) => e(formatCurrency(value));
  const tax = Math.max(0, Number(bill.totalAmount) - (Number(bill.subtotal) - Number(bill.discount)));
  const snapshot = bill.receiptSnapshot;
  const received = statement ? bill.totalReceived : snapshot?.receivedAtIssue ?? bill.totalReceived;
  const due = statement ? bill.remainingDue : snapshot?.dueAtIssue ?? bill.remainingDue;
  const row = (label, amount, className = '') => `<tr class="${className}"><td>${e(label)}</td><td class="amount">${money(amount)}</td></tr>`;
  const items = (bill.items || []).map((item) => {
    // Rate units must match the printed quantity, including centimeter pricing.
    const rate = item.stockType === 'LENGTH' ? item.pricePerUnit * 100 : item.pricePerUnit;
    const rateLabel = item.stockType === 'AREA' ? ' / cm²' : item.stockType === 'LENGTH' ? ` / ${t('billing.meters')}` : '';
    return `<tr><td><strong>${e(item.productName)}</strong><div class="muted">${e(quantityLabel(item, t))}${config.showRates ? ` · ${money(rate)}${e(rateLabel)}` : ''}</div></td><td class="amount">${money(item.total)}</td></tr>`;
  }).join('');
  const width = config.paper === 'A4' ? '190mm' : `${Number(config.paper) - 6}mm`;
  const fontFace = /^data:font\/ttf;base64,[A-Za-z0-9+/=]+$/.test(fontData) ? `@font-face{font-family:Receipt;src:url('${fontData}') format('truetype');}` : '';
  return `<!DOCTYPE html><html lang="${config.language}" dir="${config.language === 'ur' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${fontFace}
    @page { margin: 3mm; size: ${config.paper === 'A4' ? 'A4' : `${config.paper}mm 297mm`}; }
    *{box-sizing:border-box}body{margin:0;background:${palette.white};color:${palette.black};font-family:Receipt,Arial,sans-serif;font-size:${config.fontSize}px;line-height:1.5}
    main{width:100%;max-width:${width};margin:0 auto;padding:8px 0}header{text-align:center;padding-bottom:12px;border-bottom:1px dashed ${palette.ink600}}
    h1{font-size:1.7em;margin:4px 0;line-height:1.25;overflow-wrap:anywhere}p{margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere}.muted{font-size:.9em;color:${palette.ink600}}
    img{max-height:64px;max-width:110px;object-fit:contain}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{padding:${config.spacing === 'compact' ? 3 : 7}px 0;vertical-align:top;text-align:start;overflow-wrap:anywhere}
    .amount{width:36%;text-align:end;direction:ltr;font-variant-numeric:tabular-nums;padding-inline-start:8px}thead{display:table-header-group}tr{break-inside:avoid}thead th{font-size:.85em;border-bottom:1px solid ${palette.ink600}}
    .summary{border-top:1px dashed ${palette.ink600};margin-top:12px;break-inside:avoid}.total{font-size:1.2em;font-weight:bold}.meta{margin:12px 0}.footer{text-align:center;border-top:1px dashed ${palette.ink600};margin-top:16px;padding-top:12px;break-inside:avoid}
  </style></head><body><main>
    <header>${config.showLogo && config.logoData ? `<img src="${config.logoData}" alt="">` : ''}<h1>${e(config.displayName || shopName || 'AsaanKhata')}</h1>
    ${config.address ? `<p>${e(config.address)}</p>` : ''}${config.phone ? `<p dir="ltr">${e(config.phone)}</p>` : ''}</header>
    <div class="meta"><strong>${e(t(statement ? 'receipt.statement' : 'receipt.title'))}</strong>
    <p dir="ltr">#${e(snapshot?.invoiceId || bill.serverId || bill.id)}</p><p>${e(new Date(bill.createdAt).toLocaleString(config.language === 'ur' ? 'ur-PK' : config.language === 'hi' ? 'hi-IN' : 'en-PK'))}</p>
    ${config.showCustomer ? `<p>${e(bill.customerName)}</p>${config.showPhone && bill.customerPhone ? `<p dir="ltr">${e(bill.customerPhone)}</p>` : ''}` : ''}</div>
    <table><thead><tr><th>${e(t('records.items'))}</th><th class="amount">${e(t('billing.total'))}</th></tr></thead><tbody>${items}</tbody></table>
    <table class="summary">${row(t('billing.subtotal'), bill.subtotal)}${bill.discount > 0 ? row(t('billing.discount'), -bill.discount) : ''}${tax > 0.005 ? row(t('billing.tax'), tax) : ''}${row(t('billing.total'), bill.totalAmount, 'total')}${row(t('records.paidAmount'), Math.min(bill.totalAmount, received))}${row(t('billing.remainingDue'), due, 'total')}${!statement && bill.changeDue > 0 ? row(t('receipt.change'), bill.changeDue) : ''}</table>
    <p>${e(t('billing.payment.methodLabel'))}: ${e(t(paymentMethodLabelKey(bill.paymentMethod)))}</p>
    <div class="footer"><strong>${e(t(due > 0 ? 'receipt.unpaid' : 'dashboard.paid'))}</strong><p>${e(config.footer || t('receipt.thanks'))}</p>${statement ? `<p class="muted">${e(t('receipt.statementHint'))}</p>` : ''}</div>
  </main></body></html>`;
}
