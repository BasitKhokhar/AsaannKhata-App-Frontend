# AsaanKhata production roadmap

Source review: 2026-10-22. This is a source-code comparison of AttaChaki frontend/backend and AsaanKhata frontend/backend, not a Play Store binary or production-infrastructure audit. `Implemented` means code exists; it does not imply that it has passed device, store, or backend integration tests. Keep `CODEX.md` as the architecture map and this file as the delivery plan.

Implementation update (2026-10-22): local bill/product/stock mutations now use synchronous SQLite transactions; the mobile sync gate recognizes coin unlocks, starts sync after unlock, scopes pull watermarks by shop, protects pending rows from pull overwrite, and retries FCM token registration after device registration. Cached shop lists are filtered by admin, and coin state resets on account change. The RevenueCat webhook now returns HTTP 500 on unexpected processing failure so transient failures can be retried. These are partial P0 improvements; inventory event accounting, robust pull pagination, full account/device isolation, and integration tests remain open.
RevenueCat mobile SDK keys now come from build environment variables through Expo config; the real keys, store products, webhook configuration, and sandbox verification are still external release prerequisites.
RevenueCat follow-up: customer identity is restored on cold start and checked before checkout/restore; the app verifies purchases against the backend before confirming access. Backend webhook handling now reconciles the current RevenueCat subscriber snapshot, with tests for refund/grace/lifetime selection. See `REVENUECAT_SETUP.md` for required secrets, product mapping and release tests. This is implemented code, not a completed store certification.
Backend pull pagination now uses a snapshot and per-table timestamp-plus-ID cursors; a focused regression test covers 501 records sharing one timestamp. This does not resolve concurrent edit conflicts or existing duplicate stock effects.
Device registration is now repeated safely per active shop, and bill writes reject a missing/deleted/cross-shop product. The backend test command now runs the paging regression.

## Product decision

AsaanKhata should be a general shop POS and ledger, not a copy of AttaChaki's flour-mill workflow. Preserve generic quantity, area, length, and pack inventory. Adopt reusable capabilities such as reliable checkout, payment history, reports, account recovery, lifecycle messaging, and data controls. Make mill-specific services/rates optional only if research identifies a broader service-selling use case.

## Source projects reviewed

- AttaChaki mobile: `D:\Codes\Apps\POS Apps\AttaChaki\Frontend` (Expo 54; SQLite, `expo-iap`, ads, notifications, reports, guided tour).
- AttaChaki backend: `D:\Codes\Apps\POS Apps\AttaChaki\AttaChaki-POS-Backend` (Express/Prisma; products/services/orders/payments, billing verification, OTP reset, export/deletion, support issues).
- AsaanKhata mobile: this repository (Expo 57; Drizzle SQLite, React Query, RevenueCat client).
- AsaanKhata backend: `D:\Codes\Apps\AssanKhata\Backendd` (Express/Prisma; tenant-aware shops, four stock types, sync, RevenueCat webhook, ads, FCM).

## Feature inventory

| Capability | AttaChaki evidence/status | AsaanKhata evidence/status | Work still required |
| --- | --- | --- | --- |
| Registration/login/refresh | Full auth routes and mobile screens | Implemented in `hooks/useAuth.js`, `services/apiClient.js`, backend auth routes | Device tests; account isolation and session expiry tests |
| Forgot password | Email OTP request/verify/reset backend and screens | `ForgotPassword.jsx` and `OtpVerification.jsx` are disabled UI stubs; backend has no reset routes | Implement OTP/email flow, rate limits, expiry, anti-enumeration, reset UX |
| Multi-shop management | Shops supported | Shop creation/list/switching, tenant context, shop types implemented | Test switch and cleanup; add edit/delete UI if desired; verify plan/shop limits |
| Products/categories | Product and category CRUD, localized names | Create/list and four stock modes; repository/API update/delete support exists but edit/delete UI is largely absent | Add edit/delete flows, image upload sync, category management and validation |
| Stock | Kg-oriented inventory and transaction log | Quantity/area/length/pack, adjustment screen and local ledger | Fix sync accounting, unit handling, low-stock queries, returns/negative-stock policy |
| POS checkout | Dedicated POS, checkout, success, receipt; tax/discount and services | `NewBill`, `BillDetail`, cart, discounts, cash/credit | Improve receipt/checkout workflow; decide tax support by target market; validate rounding |
| Records and later payment | Order list, edit/payment history, filters, PDF | Bill list/detail and customer payments; no bill-level payment ledger or bill update UI | Add bill payment timeline/partial payments, search/filter, safe edit/void/refund rules |
| Customer ledger | Customer/master customer, payments | Credit customer list/details/payment supported | Test due calculations and cross-device balance; add edit/delete/export where needed |
| Analytics | Dashboard, premium charts, range reports, PDF | Dashboard, local sales report and cloud analytics APIs | Expose relevant analytics; add reliable date filters and downloadable reports |
| Receipt/report files | Receipt and sales/inventory/full PDF saving via SAF | Bill detail print/share PDF; no durable report download flow | Add report/receipt export and device save/open flow if required |
| Cloud sync | Local SQLite and push/pull/restore | SQLite/Drizzle, UUID mapping, sync UI and server endpoints | Resolve critical accounting, pull cursor, conflict, identity and unlock issues below |
| Subscriptions | Direct Google Play Billing through `expo-iap` and server verification | RevenueCat client and webhook/verify code | Configure real keys/products/entitlements/webhook; test purchase/restore/expiry/refund |
| Ads and coins | Banner/interstitial/reward and coin/sync economy | Banner/interstitial/reward + server coin endpoints | Verify callbacks, billing rules, free-tier sync unlock, invalid ad responses |
| Push/local reminders | Expo notifications, local reminders, push and routing | FCM push and in-app notification list; local reminder scheduling absent | Test device registration/token retry/deep links; add opt-in local reminders if needed |
| Help/privacy | Support, issue reports, data export, account delete/restore | Help text; account-delete row only signs out; support email placeholder | Build support channel, privacy/data export, actual deletion and retention policy |
| Onboarding/tour | Guided replayable tour | Four-slide onboarding only | Add contextual first-use guidance after core flows stabilize |
| Release operations | In-app update/review prompts, Play audit/readme | EAS profiles, Sentry/Firebase integration points | Release build, crash reporting, store assets/policies, staged rollout and rollback |

## P0: correctness and data safety before adding breadth

1. **Unify inventory accounting during sync.** Current mobile `useProducts.js`/`billRepository.js` change product counters and create stock ledger rows. Mobile `sync/push.js` pushes product counters, stock adjustments, and bills. Backend `services/syncService.js` writes pushed counters, applies stock adjustments, and applies bill item stock again. Define one authoritative event model: product pushes create/update metadata and initial stock only; subsequent stock changes are ledger events, with bill-linked stock events excluded from standalone adjustment push or deduplicated by an explicit origin ID. Apply correct counter for each stock mode. Migrate existing affected data with reconciliation tooling. Acceptance: create/adjust/sell/pack-break offline, sync twice, and compare local/server counters and ledger entries; all identical and idempotent.
2. **Fix pull paging and local pending-write protection.** Backend `pullChanges` queries each table separately with `take: 500` and computes a single `nextSince` from the *minimum returned timestamp*; this can repeat pages or skip rows with equal timestamps. Mobile `pull.js` overwrites matching local rows and marks them synced even when local edits are pending. Use a stable per-table cursor or a single ordered change feed with tie-breaker ID; take a server snapshot boundary; never advance beyond unapplied data; preserve pending edits and resolve conflicts explicitly. Acceptance: >500 changes, equal timestamps, interrupted pages, two-device edits, and reinstall converge without loss or infinite loops.
3. **Make free-tier sync unlock work end to end.** Backend `requireSyncQuota.js` allows free-tier PUSH during `syncUnlockExpiresAt`; mobile `syncEngine.js` returns whenever `entitlement.cloudEnabled` is false. Decide whether free-tier unlock includes pull and device registration, then use server entitlement/unlock state to run allowed sync. Acceptance: earn coins -> unlock -> sync pending data -> restore on another registered device; expired unlock blocks only intended operations.
4. **Make local bill creation atomic.** `billRepository.createBillWithItems` performs multiple inserts/stock/customer updates without an enclosing SQLite transaction. A failure can leave a partial bill, stock debit, or balance update. Wrap all related writes, including any coin-spend ledger, in a database transaction with rollback. Acceptance: injected failure at every stage leaves no partial effects.
5. **Isolate account and shop data.** The SQLite file and account-level coin usage are shared across app logins; logout intentionally retains local business data. Before login as a different admin, prevent display or sync of another admin's cached rows, coins, entitlement, and watermark. Use account-scoped database/state or a safe clear/partition strategy; keep per-shop sync cursors and device registration. Acceptance: A logs out, B logs in on same device, B sees and syncs none of A's data.
6. **Validate billing end to end.** SDK keys are injected from Expo build variables and the backend uses snapshot reconciliation with retryable webhook failures. Configure real RevenueCat/Play products, plan mappings, webhook and server secrets; test cancellation, renewal, refund, billing issue, duplicate and out-of-order events on real sandbox builds. Acceptance: sandbox purchase/restore/expiry/refund matches backend entitlement and offline cache after refresh.
7. **Correct deceptive controls.** The Settings “Delete Account” action only signs out; forgot-password screens are disabled; support contact is placeholder. Remove or clearly relabel controls until real backend flows exist. Acceptance: no production UI promises deletion/recovery/support it cannot perform.

## P1: complete core general-shop workflow

1. Catalog: add product edit/soft-delete, category edit/delete, image upload/remote URL syncing, duplicate prevention, barcode/SKU only if target shops need it. Support four stock modes consistently in form, totals, low-stock threshold and sync. Backend and local schema changes require matching migrations.
2. Checkout: support walk-in and saved customers, clear payment methods (cash/bank/wallet as recorded tender, distinct from app subscription billing), partial payments, safe refund/void and stock reversal. Add tax/discount options as market requirements dictate. Persist a bill payment ledger so later payments are attributable to bills and fully syncable.
3. Records: searchable/filterable bill history, statuses, date range, receipt reprint/share/save, payment timeline, customer statement, stock history. Add pagination for large datasets.
4. Reporting: daily/weekly/custom-range sales, profit, outstanding credit, category/product performance, inventory valuation; define cost basis and unit conversions. Provide CSV/PDF export and reconcile offline vs cloud numbers.
5. Shop operations: edit shop profile/logo, active-shop switch validation, online shop limits and deletion rules, clean handling of shop removal and orphaned local data.
6. Authentication: complete email OTP reset plus account profile edits and device/session management where practical.

## P2: monetization, lifecycle, trust

1. RevenueCat: real Android/iOS SDK keys, product IDs matching `SubscriptionPlan.revenueCatProductId`, offerings, webhook secret, backend API key, sandbox accounts, subscription history and clear purchase/restore/manage UX. Google Play Billing for in-app digital subscriptions should flow through RevenueCat's Play integration; customer tender methods in bills are a separate business feature.
2. Ads: test IDs in development, real AdMob IDs in release, consent/privacy decisions for target regions, reward deduplication, limits, cooldown, coin balance reconciliation and no ads for paid tiers.
3. Notifications: retry FCM token registration after sync device registration; handle foreground/background/cold-start navigation; align notification preferences with actual delivery. Add optional local stock/credit/trial reminders with permissions and opt-out.
4. Trust and compliance: real account deletion with backend purge/retention, self-service data export, support channel and issue reports, privacy/terms pages, data safety declarations, backup/recovery explanation.
5. Adoption: replayable contextual walkthrough, helpful empty states, feedback prompts, in-app update path if suitable for the Expo 57 release setup.

## P3: release engineering and quality gates

1. Expand automated tests beyond the new backend pull-pagination regression: add backend service/tenant/auth/sync tests, SQLite repository tests, and contract tests for inventory and billing. The frontend still has no test suite.
2. Device matrix: Android release build first; test low-memory devices, offline/reconnect, process death mid-sync, reinstall/restore, clock skew, no permissions, Urdu/Hindi/dark themes, image upload and PDF output. Verify iOS separately if shipping it.
3. Security and operations: audit tenant checks on every route, input validation, auth rate limiting, secret handling, logging/redaction, upload limits, database backups/restore drills, monitoring and alerting. AttaChaki has `helmet` and an auth limiter; AsaanKhata `app.js` currently mounts permissive `cors()` and has no equivalent visible middleware.
4. Deploy staging with separate EAS environment, backend DB, Firebase, AdMob, Sentry and RevenueCat test settings. Run migration rehearsal and a staged Play rollout; inspect crash/sync/payment metrics before broad release.

## Recommended implementation sequence

1. Freeze behavior contracts and write failing integration tests for inventory, billing, paging, conflict, free unlock, and account switching.
2. Fix P0 data/sync/account and billing correctness. Reconcile or repair development data as required.
3. Complete catalog, checkout/payment history, and records (P1).
4. Finish RevenueCat, ads, notifications, account recovery/deletion, support and reporting (P1/P2).
5. Complete release gates, store policy materials, staging migration, sandbox purchases and staged rollout (P3).

Each slice should change backend contract, Prisma migration, local Drizzle migration, repository/sync code, hooks/UI, translations, and tests together when those layers are affected. Update `CODEX.md` after architecture changes.

## Open product choices to settle before implementation

- Are services/labor bill lines needed for general shops, or should launch focus on physical goods only?
- Which countries/currencies/tax rules and tender methods are in launch scope?
- Which tiers can restore cloud data, and exactly what does a coin unlock grant?
- Should shop owners be able to edit/void synced bills, and how should stock and customer balances reverse?
- Is Android the first launch platform, with iOS later?
