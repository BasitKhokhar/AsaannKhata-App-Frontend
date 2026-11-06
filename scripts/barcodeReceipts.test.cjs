const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { DatabaseSync } = require('node:sqlite');
const babel = require('@babel/core');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, cache = new Map()) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  cache.set(file, mod.exports);
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.js'), mocks, cache);
    return require(name);
  }, console, Map, Set, Date, JSON });
  return mod.exports;
}
function database() {
  const db = new DatabaseSync(':memory:');
  const journal = JSON.parse(fs.readFileSync(path.join(root, 'src/db/migrations/meta/_journal.json')));
  for (const entry of journal.entries) db.exec(fs.readFileSync(path.join(root, 'src/db/migrations', entry.tag + '.sql'), 'utf8'));
  return db;
}
function add(db, { id = 'p1', shop = 's1', name = 'Milk', barcode = '001234', loose = null, type = 'QUANTITY' } = {}) {
  db.prepare(`INSERT INTO products (id, shop_id, name, stock_type, barcode, loose_barcode, purchase_price, sale_price, stock_quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 10, 20, 50, '2026-11-06', '2026-11-06')`).run(id, shop, name, type, barcode, loose);
}
function repository(db) {
  return load('src/db/repositories/productRepository.js', {
    '../client': { db: {}, expoDb: { getFirstSync: (sql, ...args) => db.prepare(sql).get(...args), getFirstAsync: async (sql, ...args) => db.prepare(sql).get(...args), getAllAsync: async (sql, ...args) => db.prepare(sql).all(...args) } },
    './createSyncableRepository': { createSyncableRepository: () => ({}) },
    '../../utils/stock': { isLowStock: () => false },
  }).productRepository;
}

test('all migrations preserve product images and rebuild indexed barcode/search data', () => {
  const db = new DatabaseSync(':memory:');
  const journal = JSON.parse(fs.readFileSync(path.join(root, 'src/db/migrations/meta/_journal.json')));
  for (const entry of journal.entries.filter(e => e.idx < 6)) db.exec(fs.readFileSync(path.join(root, 'src/db/migrations', entry.tag + '.sql'), 'utf8'));
  db.exec("INSERT INTO products (id,shop_id,name,image,purchase_price,sale_price,created_at,updated_at) VALUES ('old','s1','Old rice','https://example.com/rice.jpg',10,20,'now','now')");
  for (const entry of journal.entries.filter(e => e.idx >= 6)) db.exec(fs.readFileSync(path.join(root, 'src/db/migrations', entry.tag + '.sql'), 'utf8'));
  assert.equal(db.prepare('SELECT image_remote_url FROM products').get().image_remote_url, 'https://example.com/rice.jpg');
  assert.equal(db.prepare("SELECT product_id FROM product_search WHERE product_search MATCH 'rice*'").get().product_id, 'old');
  db.close();
});

test('barcode index rejects cross-unit duplicates atomically and releases deleted codes', () => {
  const db = database();
  add(db, { type: 'PACK', loose: 'loose-1' });
  assert.throws(() => add(db, { id: 'p2', barcode: 'loose-1' }), /UNIQUE/);
  assert.equal(db.prepare("SELECT count(*) AS n FROM products WHERE id='p2'").get().n, 0);
  assert.throws(() => db.prepare("UPDATE products SET loose_barcode=barcode WHERE id='p1'").run(), /UNIQUE/);
  assert.equal(db.prepare("SELECT loose_barcode FROM products WHERE id='p1'").get().loose_barcode, 'loose-1');
  add(db, { id: 'other-shop', shop: 's2', barcode: '001234' });
  db.exec("UPDATE products SET is_deleted=1 WHERE id='p1'");
  add(db, { id: 'p2' });
  assert.equal(db.prepare("SELECT product_id FROM product_barcodes WHERE shop_id='s1' AND code='001234'").get().product_id, 'p2');
  db.close();
});

test('normalization preserves zeros, handles UPC aliases and rejects invalid/duplicate codes', () => {
  const { normalizeBarcode, barcodeFields } = load('src/utils/barcodes.js');
  assert.equal(normalizeBarcode(' 001234\r\n'), '001234');
  assert.equal(normalizeBarcode('0123456789012'), '123456789012');
  assert.equal(normalizeBarcode('abc-001'), 'abc-001');
  assert.throws(() => normalizeBarcode('a\0b'), /barcode.invalid/);
  assert.throws(() => barcodeFields({ barcode: '0123456789012', looseBarcode: '123456789012', stockType: 'PACK' }), /barcode.duplicate/);
});

test('10,000 products: indexed scans, bounded pages, Unicode prefix search, rename/delete updates', async () => {
  const db = database();
  db.exec('BEGIN');
  for (let i = 0; i < 10000; i++) add(db, { id: `p${i}`, name: `Product ${String(i).padStart(5, '0')}`, barcode: `CODE${i}` });
  add(db, { id: 'ur', name: 'باسمتی چاول', barcode: 'UR1' });
  add(db, { id: 'hi', name: 'बासमती चावल', barcode: 'HI1' });
  add(db, { id: 'other', shop: 's2', name: 'Other shop', barcode: 'CODE9999' });
  db.exec('COMMIT');
  const repo = repository(db);
  const scanTimes = [];
  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    assert.equal(repo.findByBarcode('s1', 'CODE9999').id, 'p9999');
    scanTimes.push(performance.now() - start);
  }
  assert.equal(repo.findByBarcode('s2', 'CODE9999').id, 'other');
  assert.equal(repo.findByBarcode('s3', 'CODE9999'), undefined);
  const start = performance.now();
  const first = await repo.searchPage('s1', { limit: 60 });
  const second = await repo.searchPage('s1', { cursor: first.nextCursor, limit: 60 });
  assert.equal(first.rows.length, 60); assert.equal(second.rows.length, 60);
  assert.equal(new Set([...first.rows, ...second.rows].map(p => p.id)).size, 120);
  assert.equal((await repo.searchPage('s1', { search: 'Product 09999' })).rows[0].id, 'p9999');
  assert.equal((await repo.searchPage('s1', { search: 'چاو' })).rows[0].id, 'ur');
  assert.equal((await repo.searchPage('s1', { search: 'चावल' })).rows[0].id, 'hi');
  assert.equal((await repo.searchPage('s1', { search: 'CODE9999' })).rows[0].id, 'p9999');
  assert.equal((await repo.searchPage('s1', { search: '" OR *' })).rows.length, 0);
  db.exec("UPDATE products SET name='Renamed flour' WHERE id='p9999'");
  assert.equal((await repo.searchPage('s1', { search: 'flou' })).rows[0].id, 'p9999');
  db.exec("UPDATE products SET is_deleted=1 WHERE id='p9999'");
  assert.equal((await repo.searchPage('s1', { search: 'flou' })).rows.length, 0);
  const plan = db.prepare('EXPLAIN QUERY PLAN SELECT product_id FROM product_barcodes WHERE shop_id=? AND code=?').all('s1', 'CODE1');
  assert.match(plan.map(r => r.detail).join(' '), /USING INDEX product_barcodes_shop_code_idx/);
  scanTimes.sort((a,b) => a-b);
  console.log(`10k products: barcode p50=${scanTimes[500].toFixed(3)}ms p95=${scanTimes[950].toFixed(3)}ms; page/search checks=${(performance.now()-start).toFixed(1)}ms (host SQLite, not phone timings)`);
  db.close();
});

test('cart stock checks include earlier scans and separate packs from loose units', () => {
  const { lineFor, assertCartStock } = load('src/utils/cartLines.js');
  const product = { id: 'p', name: 'Pack', stockType: 'PACK', packSize: 6, stockPacks: 2, stockLooseUnits: 3, salePrice: 10, packSalePrice: 55 };
  const pack = lineFor(product, 1); const loose = lineFor(product, 3, 'loose');
  assert.equal(pack.total, 55); assert.equal(loose.total, 30);
  assert.equal(loose.packQuantity, 0); assert.equal(loose.looseQuantity, 3);
  assertCartStock(product, [pack], loose);
  assert.throws(() => assertCartStock(product, [loose], lineFor(product, 1, 'loose')), /quantityExceedsStock/);
  assert.throws(() => assertCartStock(product, [pack, pack], pack), /quantityExceedsStock/);
});

test('receipts escape owner/customer text, use frozen branding and original vs updated payments', () => {
  const { buildReceiptHtml } = load('src/utils/receiptHtml.js');
  const bill = { id: 'bill', createdAt: '2026-11-06T10:00:00Z', customerName: '<script>alert(1)</script>', subtotal: 100, discount: 0, totalAmount: 100, totalReceived: 100, remainingDue: 0, paymentMethod: 'CASH', receiptSnapshot: { displayName: 'Original shop', paper: '58', receivedAtIssue: 20, dueAtIssue: 80 }, items: [{ productName: '<img onerror="bad">', stockType: 'QUANTITY', quantity: 1, pricePerUnit: 100, total: 100 }] };
  const original = buildReceiptHtml({ bill, shopName: 'Changed shop' });
  assert.match(original, /Original shop/); assert.doesNotMatch(original, /Changed shop/);
  assert.doesNotMatch(original, /<script>|<img onerror/); assert.match(original, /&lt;script&gt;/);
  assert.match(original, /Rs 80/); assert.match(original, /58mm/);
  const statement = buildReceiptHtml({ bill, statement: true });
  assert.match(statement, /Updated payment statement/); assert.doesNotMatch(statement, /Rs 80/);
  const rtl = buildReceiptHtml({ bill, config: { language: 'ur', footer: '<b>Thanks</b>' } });
  assert.match(rtl, /dir="rtl"/); assert.match(rtl, /&lt;b&gt;Thanks&lt;\/b&gt;/);
});

function thermalHarness() {
  const calls = [];
  const state = { busy: false, target: { kind: 'bluetooth', address: 'printer' }, paper: '55', widthDots: 360, cut: false };
  const native = {
    connectBluetooth: async () => calls.push('connect'),
    getUsbDevices: () => [1, 2].map(deviceId => ({ deviceId, vendorId: 10, productId: 20, isPrinter: true, hasPermission: true })),
    connectUsb: async id => calls.push(id),
    printPdf: async () => { calls.push('write'); throw Object.assign(new Error('partial receipt'), { code: 'ERR_PRINT_INTERRUPTED' }); },
  };
  const service = load('src/services/thermalPrinter.js', {
    'react-native': { Platform: { OS: 'android', Version: 30 }, PermissionsAndroid: {} },
    'expo-print': { printToFileAsync: async () => ({ uri: 'file:///receipt.pdf' }) },
    'expo-file-system': { File: class { exists = true; delete() { calls.push('delete'); } } },
    '../../modules/expo-usb-printer': { ThermalPrinter: native },
    '../store/printerStore': { usePrinterStore: { getState: () => state, setState: patch => Object.assign(state, patch) } },
  });
  return { service, state, calls };
}
test('thermal printing blocks concurrent jobs and releases busy state after failure', async () => {
  const { service, state } = thermalHarness();
  let release;
  const first = service.printerJob(() => new Promise(resolve => { release = resolve; }));
  await assert.rejects(service.printerJob(() => assert.fail('must not run')), /printer.busy/);
  release(); await first;
  assert.equal(state.busy, false);
  await assert.rejects(service.printerJob(() => { throw new Error('failure'); }), /failure/);
  assert.equal(state.busy, false);
});
test('interrupted receipt is never retried and temporary PDF is cleaned up', async () => {
  const { service, state, calls } = thermalHarness();
  await assert.rejects(service.printThermalDocument(async paper => { assert.equal(paper, '55'); return {}; }), /partial receipt/);
  assert.deepEqual(calls, ['connect', 'write', 'delete']);
  assert.equal(state.busy, false);
});
test('USB reconnection refuses an ambiguous pair of identical printers', async () => {
  const { service, calls } = thermalHarness();
  await assert.rejects(service.connectPrinter({ kind: 'usb', vendorId: 10, productId: 20, deviceId: 9 }), /printer.notConnected/);
  assert.deepEqual(calls, []);
  await service.connectPrinter({ kind: 'usb', vendorId: 10, productId: 20, deviceId: 2 });
  assert.deepEqual(calls, [2]);
});

test('paged low-stock results and counts exclude products without an alert threshold', async () => {
  const db = database();
  add(db, { id: 'no-threshold' });
  add(db, { id: 'alert', barcode: 'alert' });
  db.exec("UPDATE products SET stock_quantity=0; UPDATE products SET low_stock_threshold=5 WHERE id='alert'");
  const repo = repository(db);
  assert.equal((await repo.counts('s1')).lowStock, 1);
  const page = await repo.searchPage('s1', { lowStock: true });
  assert.equal(page.rows.length, 1); assert.equal(page.rows[0].id, 'alert');
  db.close();
});
