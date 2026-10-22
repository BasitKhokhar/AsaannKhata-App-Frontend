# AsaanKhata frontend project context

Last repository review: 2026-10-22

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
- Server state/cache and invalidation: TanStack React Query 5.
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
- Auth: `Login`, three registration steps, `ForgotPassword`, `OtpVerification`.
- Drawer routes:
  - `HomeStack`: `Dashboard`
  - `BillingStack`: `NewBill`, `BillDetail`, `CreditCustomers`, `CustomerDetail`
  - `CatalogStack`: `ProductsList`, `AddProduct`, `StockAdjustment`
  - `StockStack`: `StockOverview`, `StockAdjustment`
  - `ShopsStack`: `ShopsList`, `AddShop`
  - Direct drawer screens: `SalesReport`, `Notifications`, `SubscriptionPlans`, `EarnCoins`
  - `SettingsStack`: `Settings`, `SyncStatus`, `Profile`, `Notifications`, `HelpSupport`, `About`
- `StockAdjustment` deliberately exists in both Catalog and Stock stacks so each stack can navigate locally.
- Cross-drawer navigation usually uses `navigation.navigate('SomeStack', { screen: 'SomeScreen' })`.

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
- Mutable syncable: `categories`, `products`, `customers`, `bills`
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

`createSyncableRepository.js` is the shared CRUD/sync factory. Extend it or follow its conventions instead of creating incompatible persistence semantics.

## Important write flows

### Bills

`useCreateBill` -> `billRepository.createBillWithItems` performs the local operation immediately:

1. Insert bill and items.
2. Decrement product stock using the product's stock mode.
3. Add one `OUT` stock transaction per line.
4. Increase the selected customer's balance by the unpaid remainder.
5. Invalidate bills/products/customers/dashboard queries.

For a free-tier bill created while offline, it also appends `coin_usage_log` and optimistically decrements the persisted coin balance. The server later applies its authoritative cost.

### Products and stock

Stock types are `QUANTITY`, `AREA`, `LENGTH`, and `PACK`.

- AREA and LENGTH are normalized to centimeters/cm² before local insertion.
- PACK tracks full packs and loose units separately.
- Product creation also writes an initial `IN` stock transaction when initial stock is positive.
- Every stock adjustment changes counters on `products` and appends a stock transaction.
- Unit-conversion logic in `src/utils/unitConverter.js` must continue matching the backend contract.

### Credit customers

Customer balances live on the customer row. Credit bills increase the balance. Standalone payments append `customer_payments` and decrement the balance.

## Synchronization contract

All triggers call `runSync()` in `src/sync/syncEngine.js`. Triggers are app startup, foreground, offline-to-online transition, every five minutes while foregrounded, and the manual Sync Now action.

Sync sequence:

1. Reconcile pending account-level coin usage for every tier.
2. Stop if no active shop or neither cached entitlement `cloudEnabled` nor a valid coin sync unlock is present.
3. Upsert this install's stable device UUID for the active shop (server registration is shop-scoped), then retry FCM token registration.
4. Pull all pages using the server-issued `nextSince`; persist the watermark per shop after every page. Pull preserves rows with pending/conflict local edits.
5. Push pending records in FK-safe order: categories -> products -> stock adjustments -> customers -> bills -> customer payments.
6. Mark successes synced, conflicts conflict, and leave errors pending for retry.

Pull ordering is categories -> customers -> products -> bills -> stock transactions -> customer payments. Server integer FKs are resolved back to local UUIDs with `idMap.js`.

Do not bypass this design by writing remote-first mutations for a domain that is already locally syncable. Also preserve push ordering when adding relations.

## State ownership

- `authStore`: in-memory auth/session; durable tokens and identity are in SecureStore.
- `shopStore`: persisted active shop ID.
- `onboardingStore`: persisted onboarding completion.
- `themeStore`: persisted `system`/`light`/`dark` preference.
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
- Paid/cloud users do not see ads.
- Development builds use Google's test ad unit IDs.
- Reward coins are granted only after the SDK emits `EARNED_REWARD` and the backend accepts `/ads/reward`.
- Interstitial navigation has a watchdog and must never block navigation indefinitely.
- FCM uses `@react-native-firebase/messaging`, not `expo-notifications`.
- The background message handler must remain registered in `index.js` before the app root.
- FCM token registration reuses the sync device UUID and currently skips registration until that device has been registered with the backend.

## UI, theme, language, and formatting conventions

- Use `useTheme()` and tokens from `src/theme`; do not add raw hex colors outside `src/theme/colors.js`.
- Brand headings use Outfit; body text uses IBM Plex Sans. Font keys must match `App.jsx` loading keys.
- Use components from `src/components/ui` and motion primitives before duplicating patterns.
- Use `showToast()` for transient feedback and `await showConfirm()` for confirmation prompts.
- English is the i18n source of truth. Add every new key to `en.js`, `ur.js`, and `hi.js`; missing translations fall back to English.
- Urdu RTL is implemented manually per screen with flex direction/text alignment. Do not enable global `I18nManager.forceRTL()` without redesigning that behavior.
- Currency formatting is centralized in `src/utils/money.js`; receipt HTML is centralized in `src/utils/receiptHtml.js`.

## Expo/native configuration

`app.config.js` is environment-driven and configures:

- Android/iOS identity `com.asaandukaan.app`
- portrait orientation, automatic system UI style, icons/splash
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
- `GOOGLE_ADMOB_ANDROID_APP_ID`
- `BANNER_AD_UNIT_ID`
- `INTERSTITIAL_AD_UNIT_ID`
- `REWARD_AD_UNIT_ID`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_DSN` (the local `.env` currently contains the misspelled `SNETRY_DSN`; `app.config.js` deliberately accepts either spelling)
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

There are currently no lint, typecheck, or test scripts. For changes, use the narrowest meaningful checks available, such as Expo diagnostics/config validation, a development build, and focused manual flows. Do not claim automated tests passed when none exist.

EAS profiles are `development`, `development-simulator`, `preview`, and `production`; development/preview Android builds are APKs and production auto-increments the remote app version.

## Known sharp edges and incomplete areas

- There is no dedicated migration-recovery UI; migration errors currently throw at the root.
- Local bill, product creation and stock-adjustment writes use Expo SQLite synchronous transactions; the wider sync accounting model still requires reconciliation with the backend before release.
- `ForgotPassword`/OTP behavior should be inspected before extending it; do not assume a complete backend reset flow from route names alone.
- The support email in `HelpSupport.jsx` is explicitly a placeholder.
- RevenueCat API keys are placeholders.
- Low-stock SQL in `productRepository.listLowStock` compares only `stockQuantity`; UI helper `isLowStock` handles all stock modes. Be careful when changing low-stock behavior.
- Local profit calculations are approximate for AREA/LENGTH modes.
- Sync conflict rows are marked but there is no general conflict-resolution workflow documented in the UI.
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
