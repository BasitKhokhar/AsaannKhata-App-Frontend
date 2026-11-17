const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const source = fs.readFileSync(path.join(__dirname, '../src/sync/syncEngine.js'), 'utf8');
const compiled = babel.transformSync(source, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

function setup({ failShop, deviceLimitShop, conflictShop, entitlement = { cloudEnabled: true }, syncUnlockExpiresAt = null } = {}) {
  const calls = [];
  const statuses = {};
  const cursors = new Map();
  const syncState = {
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
    syncStarted() { this.isSyncing = true; this.lastError = null; },
    syncFinished(time) { this.isSyncing = false; this.lastSyncAt = time; },
    syncFailed(error) { this.isSyncing = false; this.lastError = error; },
    setShopStatus(shopId, status) { statuses[shopId] = status; },
  };
  const shops = [{ id: 1, name: 'Grocery' }, { id: 2, name: 'Milk' }];
  const mocks = {
    '../services/syncApi': { syncApi: {
      async registerDevice({ shopId, replaceExisting }) {
        calls.push(['register', shopId, !!replaceExisting]);
        if (String(shopId) === String(failShop)) throw new Error('registration failed');
        if (String(shopId) === String(deviceLimitShop) && !replaceExisting) {
          const error = new Error('Request failed with status code 403');
          error.response = { data: { code: 'DEVICE_LIMIT_REACHED', message: 'Device limit reached for this plan' } };
          throw error;
        }
      },
      async pull({ shopId }) {
        calls.push(['pull', shopId]);
        return { nextSince: '2026-10-24T00:00:00.000Z', hasMore: false };
      },
    } },
    '../services/shopsApi': { shopsApi: { async list() { return shops; } } },
    '../db/repositories/deviceRepository': { deviceRepository: {
      getOrCreate: () => ({ deviceId: 'device-1' }),
      markRegistered() {}, markSynced() {},
    } },
    '../db/repositories/shopRepository': { shopRepository: { upsertMany() {} } },
    '../db/repositories/entitlementRepository': { entitlementRepository: { get: () => entitlement } },
    '../utils/entitlements': {
      hasSyncEntitlement: (value) => !!value?.cloudEnabled || ['FREE', 'FREE_TRIAL'].includes(value?.tier),
      isFreeEntitlement: (value) => ['FREE', 'FREE_TRIAL'].includes(value?.tier),
    },
    '../db/repositories/syncMetaRepository': { syncMetaRepository: {
      get: (key) => cursors.get(key), set: (key, value) => cursors.set(key, value),
    } },
    '../store/shopStore': { useShopStore: { getState: () => ({ activeShopId: '1' }) } },
    '../store/syncStore': { useSyncStore: { getState: () => syncState } },
    '../store/coinsStore': { useCoinsStore: { getState: () => ({ syncUnlockExpiresAt }) } },
    '../store/authStore': { useAuthStore: { getState: () => ({ accessToken: 'token', adminId: 5 }) } },
    '../services/fcmService': { registerCurrentToken: async () => null },
    './receiptProfiles': { syncReceiptProfile: async (shopId) => { calls.push(['receipt', shopId]); return { conflict: shopId === conflictShop }; } },
    './pull': { cachePulledProductImages: async () => {}, applyPullPage: (_page, shopId) => calls.push(['apply', shopId]) },
    './push': {
      pushPendingCoinUsage: async () => {},
      pushAllPending: async (shopId) => calls.push(['push', shopId]),
    },
    '../services/queryClient': { queryClient: { invalidateQueries() {} } },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (id) => {
      if (!mocks[id]) throw new Error(`Unmocked dependency: ${id}`);
      return mocks[id];
    },
  });
  return { runSync: module.exports.runSync, calls, statuses, syncState, cursors };
}

test('sync visits every owned shop without changing the selected shop', async () => {
  const { runSync, calls, statuses, syncState, cursors } = setup();
  await runSync();
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), [['push', '1'], ['push', '2']]);
  assert.deepEqual(statuses, { 1: 'synced', 2: 'synced' });
  assert.equal(syncState.lastError, null);
  assert.equal(cursors.size, 2);
});

test('one shop failure does not prevent another shop from syncing', async () => {
  const { runSync, calls, statuses, syncState } = setup({ failShop: '1' });
  await runSync();
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), [['push', '2']]);
  assert.deepEqual(statuses, { 1: 'error', 2: 'synced' });
  assert.match(syncState.lastError, /Grocery: registration failed/);
});

test('device-limit responses retain their code and an explicit replacement retries registration', async () => {
  const { runSync, calls, statuses, syncState } = setup({ deviceLimitShop: '1' });
  const first = await runSync();
  assert.equal(first.ok, false);
  assert.equal(first.code, 'DEVICE_LIMIT_REACHED');
  assert.match(first.message, /Grocery: Device limit reached for this plan/);
  assert.equal(syncState.lastError, first.message);

  const second = await runSync({ replaceExistingDevices: true });
  assert.equal(second.ok, true);
  assert.deepEqual(statuses, { 1: 'synced', 2: 'synced' });
  assert.ok(calls.some(([kind, shopId, replaceExisting]) => kind === 'register' && shopId === '1' && replaceExisting));
});

test('receipt design conflict does not block business writes for either shop', async () => {
  const { runSync, calls, statuses, syncState } = setup({ conflictShop: '1' });
  await runSync();
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), [['push', '1'], ['push', '2']]);
  assert.deepEqual(statuses, { 1: 'error', 2: 'synced' });
  assert.match(syncState.lastError, /receipt.conflict/);
});

test('free accounts skip background sync outside an unlock window', async () => {
  const { runSync, calls, syncState } = setup({ entitlement: { tier: 'FREE', cloudEnabled: false } });
  const result = await runSync();
  assert.equal(result.reason, 'SYNC_UNLOCK_REQUIRED');
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), []);
  assert.equal(syncState.lastError, null);
});

test('free accounts sync while the manual unlock window is active', async () => {
  const { runSync, calls, syncState } = setup({
    entitlement: { tier: 'FREE', cloudEnabled: false },
    syncUnlockExpiresAt: '2099-01-01T00:00:00.000Z',
  });
  await runSync();
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), [['push', '1'], ['push', '2']]);
  assert.equal(syncState.lastError, null);
});

test('Lifetime Offline remains local-only', async () => {
  const { runSync, calls, syncState } = setup({ entitlement: { tier: 'LIFETIME', cloudEnabled: false } });
  await runSync();
  assert.deepEqual(calls.filter(([kind]) => kind === 'push'), []);
  assert.equal(syncState.lastError, null);
});
