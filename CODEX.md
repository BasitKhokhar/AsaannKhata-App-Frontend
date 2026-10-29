# AsaanKhata frontend project context

Last repository review: 2026-10-29

This is the durable project map for coding agents. Read this before scanning the repository. Inspect only the files relevant to the current task after reading it, and update this document whenever an architectural change makes it inaccurate.

## Non-negotiable project instruction

- This app uses Expo SDK 57. Before writing code, read the exact versioned documentation at <https://docs.expo.dev/versions/v57.0.0/> and the relevant SDK 57 pages for any Expo API being changed.
- SDK 57 targets React Native 0.86, React 19.2.3, Android 7+/API 36, iOS 16.4+, and Node 22.13.x minimum.
- Install Expo/native dependencies with `npx expo install`, not an unversioned package guess.

## Product in one paragraph

AsaanKhata is a portrait mobile bookkeeping/POS app for small shops. It supports multiple shops, products and categories, four stock modes, bills/receipts, credit-customer ledgers, stock adjustments, dashboards/reports, cloud synchronization, subscriptions, ads/reward coins, notifications, light/dark themes, and English/Urdu/Hindi. Core business writes are offline-first: the UI commits to local SQLite immediately and the sync engine later reconciles eligible accounts with the backend.

## Stack and runtime shape

- Expo `~57.0.12`, React Native `0.86.2`, React `19.2.3`; JavaScript/JSX (no TypeScript).
- Entry: `index.js` initializes Sentry, registers the background FCM handler, and registers `App`.
- Root: `App.jsx` loads fonts, runs Drizzle migrations, restores SecureStore auth, holds the native splash until ready, initializes ads/analytics/FCM, mounts providers and global toast/confirm UI, and enables sync triggers.
- Navigation: React Navigation 7 with native stacks and a drawer. This project does **not** use Expo Router.
- Local database: Expo SQLite + Drizzle ORM. Database name: `asaankhata.db`.
- Server state/cache and invalidation: TanStack React Query 5. `src/services/queryClient.js` owns the singleton used by the provider and the sync engine; successful sync invalidates shop-scoped local queries.
- Client state: Zustand 5; durable preferences use Zustand persist + AsyncStorage.
- Networking: Axios with auth/shop interceptors.
- Motion/UI: Reanimated 4, Moti, Lucide icons, SVG, FlashList, gifted charts.
- Native services: Firebase Analytics/Messaging, Sentry, Google Mobile Ads, RevenueCat.
- The New Architecture is enabled.

## Startup and root navigation

`index.js` -> `App.jsx` -> `RootNavigator`.

`App.jsx` does not render the application tree until fonts, SQLite migrations, and secure-session hydration all finish. Migration failure is fatal. Once ready, provider nesting is:

1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. `QueryClientProvider`
4. `ThemeProvider`
5. `RootNavigator`, global `Toast`, global `ConfirmDialog`

`RootNavigator` swaps the entire navigation tree:

- Authenticated -> `AppDrawer`
- Not authenticated and onboarding unseen -> `OnboardingStack`
- Not authenticated and onboarding complete -> `AuthStack`

Firebase Analytics screen views are emitted on navigation route changes.

## Navigation map

- Onboarding: `Splash` -> `Onboarding1` -> `Onboarding2` -> `Onboarding3` -> `Onboarding4`.
- Auth: `Login`, three registration steps (business type, shop details, account), `ForgotPassword`, `OtpVerification`. Registration still creates the account and first shop in one backend call, with a free trial; paid plan selection is available after sign-in. ForgotPassword requests a 6-digit email code; OtpVerification confirms the code and sets a new password through backend auth endpoints.
- Drawer routes:
  - `HomeStack`: `Dashboard`
  - `BillingStack`: `NewBill`, `Payment`, `BillDetail`, `CreditCustomers`, `CustomerDetail`, `AddProduct`
  - `CatalogStack`: `ProductsList`, `ProductDetail`, `EditProduct`, `AddProduct`, `StockAdjustment`
  - `StockStack`: `StockOverview`, `StockAdjustment`
  - `ShopsStack`: `ShopsList`, `AddShop`
  - Direct drawer screens: `SalesReport`, `Expenses`, `Notifications`, `SubscriptionPlans`, `EarnCoins`
  - `RecordsStack`: `RecordsList`, `RecordDetail`, `RecordPayment` (shop-scoped invoice table with full-screen bill detail and later-payment entry)
  - `SettingsStack`: `Settings`, `SyncStatus`, `Profile`, `StaffManagement`, `Notifications`, `HelpSupport`, `About`
- `AddProduct` exists in both Billing and Catalog stacks so a product created during billing returns to `NewBill`; `StockAdjustment` deliberately exists in both Catalog and Stock stacks so each stack can navigate locally.
- Cross-drawer navigation usually uses `navigation.navigate('SomeStack', { screen: 'SomeScreen' })`.
- Dashboard, Products, Reports, and Settings also render a shared five-destination bottom navigation (Home, Sales, Products, Reports, More). Sales opens `NewBill`; secondary routes remain in the drawer/stacks.

## Directory ownership

- `src/screens/`: route-level UI grouped by domain.
- `src/components/ui/`: reusable branded primitives. Prefer these over one-off screen controls.
- `src/components/motion/`: reusable animation/presentation components.
- `src/components/drawer/SidebarContent.jsx`: custom drawer menu and shop/account surface.
- `src/hooks/`: UI-facing orchestration. Hooks read repositories/API services and invalidate query keys.
- `src/store/`: Zustand state.
- `src/db/schema.js`: complete local schema.
- `src/db/repositories/`: synchronous local persistence and domain operations.
- `src/sync/`: pull/push engine and ID mapping.
- `src/services/`: HTTP endpoints and native SDK adapters.
- `src/theme/`: brand tokens and `ThemeProvider`.
- `src/i18n/`: flat `en`, `ur`, and `hi` dictionaries.
- `src/utils/`: currency/date/stock/unit/receipt helpers.
- `plugins/`: local Expo config plugins.
- `android/`: generated/native Android project. Treat config in `app.config.js` as the primary Expo configuration unless a task specifically requires native edits.

## Offline-first data model

The schema is in `src/db/schema.js`. Tables are:

- Cached/server-backed: `shops`
- Mutable syncable: `categories`, `products`, `customers`, `bills`, `expenses`
- Nested under bills: `bill_items`
- Append-only syncable ledgers: `stock_transactions`, `customer_payments`
- Account-level append-only reconciliation: `coin_usage_log`
- Infrastructure/cache: `devices`, `sync_meta`, `entitlement_cache`

Syncable rows use these conventions:

- Local `id` is a UUID created with `expo-crypto`; it is sent to the backend as `clientId` and remains the stable local PK.
- Backend integer identity is stored separately in nullable `serverId`.
- Local foreign keys always point to local UUIDs, never server integers.
- Mutable rows soft-delete through `isDeleted`/`deletedAt`.
- `syncStatus` is local-only: `pending`, `synced`, or `conflict`.
- `updatedAt` is the conflict/watermark field for mutable records.
- Shops are not created offline; `shopRepository` is a read-through cache for server shops.
- Bill items do not sync independently; they travel inside their parent bill and are replaced wholesale on pull.
- Bill/customer detail hooks verify that the requested record belongs to the selected shop; bill creation and customer payments reject cross-shop references locally.

`createSyncableRepository.js` is the shared CRUD/sync factory. Extend it or follow its conventions instead of creating incompatible persistence semantics. Migrations `0004_greedy_gauntlet` and `0005_thankful_piledriver` add shop-scoped list/pending indexes, server-ID lookup indexes, bill-item parent lookup, and stock-history type/date lookup to keep multi-shop history queries efficient.

## Important write flows

### Bills

`NewBill` builds the cart, and `Payment` records cash/card/mobile-wallet/credit settlement through `useCreateBill` -> `billRepository.createBillWithItems`. Checkout accepts separate first/last-name fields backed by the existing combined customer `name`; choosing a saved customer links it, while completing a bill with a new entered name creates and links the customer in the same local transaction. Card and wallet are records of external payments; the app does not process those payments. The local operation immediately:

1. Insert bill and items.
2. Decrement product stock using the product's stock mode.
3. Add one `OUT` stock transaction per line.
4. Increase the selected customer's balance by the unpaid remainder.
5. Invalidate bills/products/customers/dashboard queries.

The transaction rejects a bill when its combined lines exceed the latest local stock snapshot, preventing duplicate cart lines or stale checkout screens from silently overselling inventory.

For a free-tier bill created while offline, it also appends `coin_usage_log` and optimistically decrements the persisted coin balance. The server later applies its authoritative cost.

### Products and stock

Stock types are `QUANTITY`, `AREA`, `LENGTH`, and `PACK`.

- AREA and LENGTH are normalized to centimeters/cm² before local insertion.
- PACK tracks full packs and loose units separately.
- Product creation also writes an initial `IN` stock transaction when initial stock is positive.
- Selecting a product opens a shop-scoped detail screen. `AddProduct` is the shared create/edit form: `EditProduct` routes to it with a product ID, preloads the existing values, and updates metadata, category, prices, image and low-stock threshold locally. Inventory fields are visible but locked while editing; quantity changes remain in the dedicated Stock Adjustment flow so every change retains an audit row.
- Every stock adjustment changes counters on `products` and appends a stock transaction.
- The Stock History screen pages SQLite transactions by selected shop and type (100 per page); cloud changes arrive through sync rather than a second unbounded history request.
- Unit-conversion logic in `src/utils/unitConverter.js` must continue matching the backend contract.
- Product low-stock thresholds are optional and synchronized to Prisma. AREA/LENGTH thresholds entered in the selected form unit are normalized to cm²/cm; alerts compare against the stored stock counter. PACK compares full packs plus loose units. An unset threshold suppresses that product's low-stock alert.

### Credit customers

Customer balances live on the customer row. Credit bills increase the balance. Standalone payments append `customer_payments` and decrement the balance.
The Records stack uses `billSettlementRepository` to associate later customer payments with a bill via a stable `asaankhata:bill:<bill client ID or server ID>|<payment ISO time>` note, using the existing sync payload. A payment and customer-balance adjustment commit in one SQLite transaction. The table, full-screen record detail, and customer history derive displayed due/status from the original bill plus its linked payments; no bill items or stock are rewritten when collecting a later payment. The timestamp in the note preserves the actual offline payment time after the backend assigns its receive time. The initial checkout payment is shown as the first history entry when positive.

### Expenses

`useExpenseActions` writes shop-scoped expense rows locally through `expenseRepository`; edits and deletes use the same pending/soft-delete sync conventions as products. `Expenses` filters the ledger by date. Dashboard profit is gross sales profit (sold-line revenue minus current product cost) and excludes expenses. Local sales reports show gross profit, expenses, and net profit separately. Pack cost uses `packPurchasePrice` when configured, otherwise loose-unit purchase price times pack size. Report bill items and current product costs are fetched in bounded joined groups instead of one query per bill. Expense records have no attachment or staff attribution yet.

## Synchronization contract

All triggers call `runSync()` in `src/sync/syncEngine.js`. Triggers are app startup, foreground, offline-to-online transition, every five minutes while foregrounded, and manual Sync Now actions. Dashboard exposes Sync for every plan: cloud-enabled plans sync directly, while offline/free plans use the existing server-authoritative coin unlock before running the same engine.

Sync sequence:

1. Reconcile pending account-level coin usage for every tier.
2. Stop if neither cached entitlement `cloudEnabled` nor a valid coin sync unlock is present. Otherwise fetch the signed-in admin's authoritative shop list from the backend; the active shop is only a UI selection.
3. For each owned shop, send an explicit `X-Shop-Id`, upsert this install's stable device UUID for that shop (server registration is shop-scoped), and pull all pages using the server-issued `nextSince`. Persist the watermark per shop after every page. Pulled rows are checked against the requested shop and pending/conflict local edits are preserved.
4. Push that shop's pending records in FK-safe order: categories -> products -> stock adjustments -> customers -> bills -> customer payments -> expenses. Push requests are capped at 100 operations. Product stock counters are the snapshot sent to the server; synced adjustment and bill operations record audit rows without applying those stock movements again. Bill sale logs are sent with their parent bill and matched by client ID on the next pull.
5. Mark successes synced, conflicts conflict, and leave errors pending for retry. A failure in one shop does not stop attempts for the remaining shops; the overall sync reports failure until all shops succeed.

Push acknowledgements are validated against every operation in the sent batch. Mutable rows are marked synced/conflicted only when their `updatedAt` still matches the version sent, so an edit made while a request is in flight stays pending for the next pass. The backend must retain its unique `(shopId, clientId)` constraints; frontend retry safety does not replace server-side idempotency.

Pull ordering is categories -> customers -> products -> bills -> stock transactions -> customer payments -> expenses. Server integer FKs are resolved back to local UUIDs with `idMap.js`.

Do not bypass this design by writing remote-first mutations for a domain that is already locally syncable. Also preserve push ordering when adding relations.

## State ownership

- `authStore`: in-memory auth/session; durable tokens and identity are in SecureStore.
- `shopStore`: persisted active shop ID.
- `onboardingStore`: persisted onboarding completion.
- `themeStore`: persisted `system`/`light`/`dark` preference plus a palette preset and per-admin/per-shop palette overrides. `ThemeProvider` suggests a preset from the active shop type when no override exists. Palette preferences are currently device-local, not synced to the backend.
- `StaffManagement` shows the owner account and an explicit unavailable state. Staff identity, invite, and role permissions do not exist in the backend; no staff actions are enabled.
- `languageStore`: persisted `en`/`ur`/`hi`, `t()` helper, and Urdu RTL signal.
- `notificationPrefsStore`: persisted in-app preference flags; not system push registration.
- `coinsStore`: persisted ad/coin snapshot and rewarded-ad pacing.
- Coin snapshots are tagged with an admin ID and reset when a different account signs in. Cached shops are filtered by admin ID. Full account-scoped SQLite/device isolation remains required before release.
- `cartStore`: ephemeral checkout cart.
- `registerStore`: ephemeral multi-step registration data.
- `syncStore`: ephemeral live sync status.
- `toastStore` and `confirmStore`: global imperative UI.

Auth tokens must stay in `expo-secure-store`, not AsyncStorage. Axios reads current auth and active shop directly from Zustand, adds `Authorization` and `X-Shop-Id`, serializes concurrent refresh attempts, and clears only the session (not SQLite data) when refresh fails.

## API and cloud-only behavior

The backend base URL has no `/api` prefix. Resolution order is Expo config `extra.apiBaseUrl`, `EXPO_PUBLIC_API_BASE_URL`, then Android emulator `http://10.0.2.2:5000`.

Most core domain reads/writes use repositories. Notable online/server paths include auth, shop creation, subscription offerings/verification, notifications, remote dashboard analytics, rewarded ads, and sync endpoints. `useDashboardStats` falls back to local analytics; the detailed product/category/profit trend hooks are cloud-only. Notifications have no SQLite cache.

## Subscriptions, ads, coins, and push

- Entitlement is cached in SQLite so `canWrite`/`cloudEnabled` can be checked offline.
- RevenueCat `app_user_id` must equal backend `adminId`; login occurs after successful app auth.
- RevenueCat platform SDK keys are read from `app.config.js` extra values supplied by `REVENUECAT_ANDROID_SDK_KEY` and `REVENUECAT_IOS_SDK_KEY`; purchases require those build environment values and matching store products.
- `REVENUECAT_SETUP.md` is the current billing setup contract: native checkout uses the backend Admin ID, purchase/restore calls `/subscriptions/verify`, and the backend reconciles RevenueCat subscriber snapshots for webhooks. SDK keys are public; REST API and webhook secrets are backend-only. A store sandbox/release build is still required to certify the flow.
- The Plans screen fetches active backend `SubscriptionPlan` rows and the RevenueCat current offering on focus. It groups Cloud Sync billing variants into separate family cards by the plan-code prefix before `_MONTHLY`/`_SEMIANNUAL`/`_YEARLY` (for example, Basic and Pro). Each family card contains billing-period tabs, one selected RevenueCat `priceString`, backend-provided description/features, and its own purchase button; Pro-family cards receive the recommended treatment. `features` may arrive as parsed JSON or a JSON string. Missing offering packages leave the matching purchase button disabled. The current subscription and remaining days/hours/minutes come from `/subscriptions/me` (or its offline entitlement cache).
- Backend seed upserts the nine-row Free/Lifetime/Basic/Pro catalog with localized feature arrays and RevenueCat product IDs (overrideable through `REVENUECAT_*_PRODUCT_ID` server environment variables). It migrates the legacy generic Lifetime and Cloud Sync codes to equivalent non-downgrading plans. Matching Play base plans use `subscriptionId:basePlanId` identifiers, and the backend subscriber reconciler resolves the base plan before selecting the plan row.
- Paid/cloud users do not see ads.
- Development builds use Google's test ad unit IDs.
- Reward coins are granted only after the SDK emits `EARNED_REWARD` and the backend accepts `/ads/reward`.
- Interstitial navigation has a watchdog and must never block navigation indefinitely.
- FCM uses `@react-native-firebase/messaging`, not `expo-notifications`.
- Firebase Messaging and Analytics use the named modular APIs from React Native Firebase 26; those packages no longer export callable defaults.
- The background message handler must remain registered in `index.js` before the app root.
- FCM token registration reuses the sync device UUID and currently skips registration until that device has been registered with the backend.

## UI, theme, language, and formatting conventions

- Use `useTheme()` and tokens from `src/theme`; do not add raw hex colors outside `src/theme/colors.js`. `colors.js` provides Emerald, Ocean, Indigo, Amber, Rose, Slate, and Classic presets in light/dark modes. The app's default is Emerald, while existing navy/gold remains available as Classic.
- Brand headings use Outfit; body text uses IBM Plex Sans. Font keys must match `App.jsx` loading keys.
- Use components from `src/components/ui` and motion primitives before duplicating patterns.
- Full-page forms use `KeyboardAwareView` with `KeyboardAwareScrollView`; input sheets inherit the same keyboard-safe behavior from the shared `Sheet`. Android is explicitly configured with `softwareKeyboardLayoutMode: resize`.
- Use `showToast()` for transient feedback and `await showConfirm()` for confirmation prompts.
- English is the i18n source of truth. Add every new key to `en.js`, `ur.js`, and `hi.js`; missing translations fall back to English.
- Urdu RTL is implemented manually per screen with flex direction/text alignment. Do not enable global `I18nManager.forceRTL()` without redesigning that behavior.
- Currency formatting is centralized in `src/utils/money.js`; receipt HTML is centralized in `src/utils/receiptHtml.js`.

## Expo/native configuration

`app.config.js` is environment-driven and configures:

- Expo project slug `asaankhataapp`, matching the EAS project referenced by `EXPO_ID`
- Android/iOS identity `com.asaandukaan.app`
- portrait orientation, automatic system UI style, icons/splash, and Android keyboard resize mode
- SQLite, SecureStore, fonts, image picker, sharing/file system
- Firebase app, Sentry, Google Mobile Ads
- Android `allowBackup: false`
- Explicit Android `INTERNET` and `POST_NOTIFICATIONS` permissions
- a local Kotlin compiler workaround plugin

`babel.config.js` uses `inline-import` for `.sql` migrations and keeps `react-native-worklets/plugin` last. `metro.config.js` uses Sentry's Expo config and treats `.sql` as source. Do not reorder/remove these casually.

The Kotlin workaround in `plugins/withKotlinSkipMetadataVersionCheck.js` adds `-Xskip-metadata-version-check` because the ads/Firebase/native dependency graph otherwise disagrees with Expo 57's Kotlin metadata/compiler versions.

Environment variable names currently used:

- `EXPO_ID`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPPORT_EMAIL` (optional; Help & Support shows an email action only when configured)
- `GOOGLE_ADMOB_ANDROID_APP_ID`
- `BANNER_AD_UNIT_ID`
- `INTERSTITIAL_AD_UNIT_ID`
- `REWARD_AD_UNIT_ID`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_DSN` (preferred) or `SENTRY_DSN_URL` (used by the local `.env`); `app.config.js` also accepts the legacy `SNETRY_DSN` typo. One of these must be present in the selected EAS build environment for Sentry to initialize.
- `SENTRY_AUTH_TOKEN` (sensitive build variable for Sentry source map upload; keep it out of app config and commits)
- `REVENUECAT_ANDROID_SDK_KEY` and `REVENUECAT_IOS_SDK_KEY`

Never place environment values or `google-services.json` contents in logs or documentation.

## Database migrations

- Schema source: `src/db/schema.js`
- Drizzle config: `drizzle.config.js`
- Generated migrations: `src/db/migrations/`
- Metro/Babel are configured to bundle raw `.sql` files.
- `src/db/migrations/migrations.js` imports each migration explicitly.

When changing schema, generate a Drizzle migration and ensure the generated SQL, metadata journal/snapshot, and explicit migration imports remain consistent. Never edit the schema alone and assume existing installs will update.

## Commands and verification

Available package scripts:

```text
npm start        # Expo dev server
npm run android  # native Android development build
npm run ios      # native iOS development build
npm run web      # Expo web dev server
```

There are currently no package-level lint, typecheck, or test scripts. A focused multi-shop sync test is available with `node --test scripts/multiShopSync.test.cjs`. For other changes, use the narrowest meaningful checks available, such as Expo diagnostics/config validation, a development build, and focused manual flows. Do not claim broader automated coverage than exists.

EAS profiles are `development`, `development-simulator`, `preview`, and `production`; development/preview Android builds are APKs, while production Android builds are AABs (`android.buildType: app-bundle`) and auto-increment the remote app version.

## Known sharp edges and incomplete areas

- There is no dedicated migration-recovery UI; migration errors currently throw at the root.
- Local bill, product creation and stock-adjustment writes use Expo SQLite synchronous transactions. The snapshot/ledger double-application path was removed for synced bills and adjustments, but concurrent edits from multiple devices and older pending rows still require end-to-end reconciliation against a migrated backend before release.
- Password recovery uses `POST /auth/admin/password-reset/request` and `POST /auth/admin/password-reset/confirm`; SMTP stays on the backend. Keep reviewer credentials out of Expo environment variables and app bundles.
- Help & Support requires `EXPO_PUBLIC_SUPPORT_EMAIL` for a contact action; otherwise it explains that contact is unavailable.
- RevenueCat API keys are placeholders.
- Low-stock thresholds are optional; products with no threshold do not appear in low-stock lists. The backend must deploy the matching Prisma migration before its product/sync/dashboard paths use this field.
- Local profit uses each product's current purchase cost as its cost basis. Historic margin can change after cost edits; a sale-time cost snapshot is still required for audited profit reports.
- Sync conflict rows are marked but there is no general conflict-resolution workflow documented in the UI.
- Bill-linked later payments sync as customer-payment ledger entries, but the current backend has no bill-payment relation or payment-only bill update sync operation. The backend Bill row's stored `remainingDue`/`status` may remain at its checkout values even when the app's Records, Bill Detail and customer history derive the settled values. Server-side reports using stored Bill fields need a matching backend contract before they can reflect later settlement accurately.
- Pulled rows without a backend `clientId` may use stringified server IDs as local IDs; keep ID mapping logic centralized.
- Several mojibake-looking comment/string sequences may reflect encoding issues. Preserve UTF-8 and verify user-visible receipt/text output when touching affected files.
- No CI/test configuration is present in this repository.

## Change checklist

Before finishing a code change, consider only the relevant items:

1. Read SDK 57 docs for changed Expo APIs.
2. Preserve local-first semantics and transaction side effects.
3. Add/update a migration for schema changes.
4. Preserve UUID/server-ID mapping and sync dependency order.
5. Invalidate all affected React Query keys.
6. Add translations in all three dictionaries.
7. Use theme/UI primitives and check light, dark, and Urdu layouts.
8. Keep secrets/tokens out of AsyncStorage, logs, commits, and docs.
9. Consider offline, free-tier, paid/cloud, and multi-shop behavior.
10. Update this file if architecture, routes, commands, environment keys, or known limitations changed.
