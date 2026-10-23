# ShopPro flow board adaptation plan for AsaanKhata

Status: implementation in progress. Based on the supplied 25-screen image, the current frontend, and the sibling backend repository reviewed on 2026-10-23. The image is a visual reference; its sample names, balances, prices, and subscription amounts are not product data or implementation instructions. The user confirmed the AsaanKhata name and logo remain.

## Implementation checkpoint (2026-10-23)

- Implemented: Emerald-centered multi-palette themes in `colors.js`, per-shop device-local selection, Settings picker, shared five-destination bottom bar, refreshed primary screens, business-type-first registration, two-step supported product modes, POS payment step, expense ledger, net-profit reporting, and backend/local migrations for payment method, expenses, and low-stock thresholds.
- The screenshot's weight, volume, service, and custom product modes still require a complete stock/billing/sync contract. Staff accounts, cross-device theme preferences, multi-currency accounting, mixed payments/refunds, social login, password reset, and live chat remain outside the implemented contract. They must not be presented as working features.
- Backend Prisma migrations are prepared but have not been applied to a running MySQL database. Native device QA and an end-to-end sync run against migrated MySQL remain required before release.

## 1. Current contract and constraints

- Frontend: Expo SDK 57, React Navigation 7, React Query, Zustand, Expo SQLite/Drizzle, and a local-first sync engine. `CODEX.md` is the architecture map. SDK 57 documentation: <https://docs.expo.dev/versions/v57.0.0/>.
- Backend: Express, Prisma/MySQL. `Admin` owns multiple `Shop` rows; a shop has a `ShopType`. Core entities are products, categories, bills and items, customers and payments, stock transactions, devices, subscriptions, notifications, and ad coins.
- Present navigation covers onboarding, login, three registration steps, dashboard, products, stock, bills, credit customers, reports, shops, subscription, notifications, and settings. It uses a drawer. The reference uses a bottom tab bar for main areas.
- Existing theme has one navy/gold palette, light/dark variants, and a persisted system/light/dark mode. The requested business-themed palette selection is new.
- Existing backend stock types are `QUANTITY`, `AREA`, `LENGTH`, `PACK`. The image offers piece/count, weight, volume, length/area, service, and custom units. These are not equivalent and require explicit data/price/stock semantics.
- Existing bills record subtotal, discount, amount received, change, and due; they do not record cash/card/wallet payment methods. Customers have balances and payment ledgers. Existing reports have sales analytics, but there is no expense ledger.
- ShopTypes are loaded from the backend. Its seeded types include general store, hardware, pharmacy, mobile accessories and several construction/material types, but not the full set pictured (milk shop, atta chakki, bakery, restaurant, salon, auto parts, etc.). Do not replace backend IDs with a hardcoded image list.
- Shop and admin models do not have country or operating currency fields; subscription price currency is separate. The app money formatter defaults to Rs. The image's country/currency selectors need a real shop-level contract before promising multi-currency behavior.
- No staff model, staff authentication, or role permissions exist. There is no Google/Apple sign-in API, password reset/OTP API, live chat API, or public account profile update API. The current forgot-password/OTP screens are intentionally disabled UI stubs.
- `Product.lowStockThreshold` exists in local SQLite, but the Prisma `Product` model does not expose that field. Low-stock presentation is already inconsistent between local and server computations; reconcile before redesigning its report and alerts.

## 2. Visual system to build once

Match the reference's clean white canvas, dark ink, compact typography, soft gray cards, thin borders, rounded inputs, green primary actions, colorful feature icons, modest shadows, and spacious mobile forms. Scale for actual safe areas and small screens instead of copying fixed image dimensions. Preserve accessibility, dark mode, English/Urdu/Hindi, and the four stock modes already in use.

Create shared primitives for the top bar, bottom navigation, card/stat tile, metric chip, row, segmented control, search/filter field, step indicator, fixed bottom CTA, modal/sheet, empty/loading/error state, and transaction status. Apply them through tokenized colors and spacing; avoid screen-local hex values. The new bottom bar should cover Home, Sales, Products, Reports, and More. Keep secondary destinations reachable from More and preserve nested-stack/deep-link navigation and back behavior.

Illustrations and icons are assets/design work: source or create compatible artwork for splash and onboarding, use a consistent icon family for business types, and provide fallback icons for types returned by the backend. Never treat the screenshot's sample transactions or user identities as fixtures in production UI.

## 3. Theme design and persistence

Refactor `src/theme/colors.js` into multiple named palette presets, each with light and dark semantic tokens. Proposed starter presets: Emerald (reference default), Ocean, Indigo, Amber, Rose, and Slate. Keep the existing navy/gold palette as a `Classic` option for users already on the app. Each preset must provide the current token shape (`brand`, `surface`, `ink`, `semantic`, `gradient`) so all screens keep the same layout and behavior.

Theme choice and light/dark/system are independent settings. `src/store/themeStore.js` should store a validated preset key plus the existing mode. `src/theme/index.js` resolves both. The settings UI should show live palette previews, the current selection, and a reset-to-business-default action. Initial/default preset can be suggested from `ShopType.code`; a user override always wins. On shop switch, restore that shop's chosen preset. Scope preferences by admin and shop so one account or shop cannot leak a choice to another. Keep a safe Classic fallback for old installs, unknown backend types, and missing stored keys.

For cross-device consistency, add `Shop.themeKey` to Prisma, validate against allowed keys in the shop update endpoint, return it in shop reads and registration response, and cache it in local `shops`. Since shops are currently server-created and cached rather than normally syncable, queue an offline theme change as a small shop-preference outbox operation or clearly keep it device-local until online; do not silently overwrite a newer server value. If cross-device theme sync is out of scope, omit the backend field and explicitly describe the preference as device-local. Recommended target is per-shop, cross-device persistence.

Theme changes should not alter business logic, units, prices, charts' meaning, or navigation structure. Review contrast for green-on-white, success/warning/danger, dark cards, charts, receipts, and disabled controls.

## 4. Screen-by-screen mapping

| Reference | Existing area | Required work |
| --- | --- | --- |
| 1 Splash | `Splash` | Recompose with reference-style green gradient, logo/feature strip; retain real startup readiness and branding decision. |
| 2–5 Onboarding | Four onboarding screens | Replace slide copy/art/composition; keep skip/progress and first-launch behavior. |
| 6 Business type | Registration step 2 currently combines shop/type | Split into searchable type picker backed by `/shop-types`; show all active server types with compatible icon mapping. |
| 7 Shop details | Registration step 2 | Separate name/address/phone details; add country/base currency only after backend shop fields and validation exist. |
| 8 Create account | Registration step 1/3 | Reorder wizard to type → shop → account; preserve password confirmation and terms, and expose plan choice at an appropriate honest point. Registration remains one atomic backend call. |
| 9 Login | `Login` | Restyle. Keep email/password functional; add social buttons only when provider and backend verification are implemented. Keep reset link visibly unavailable until reset API exists. |
| 10 Home | `Dashboard` | Reference-style KPI cards, quick actions, low-stock and dues, real local/cloud stats, shop switch, and bottom tabs. Define whether Profit is gross or net. |
| 11–12 Add product | `AddProduct` | Two-step product flow with mode selection and relevant fields. Preserve area/length/pack conversions; add weight/volume/service/custom only with model, sync, and billing support. |
| 13 Product list | `ProductsList` | Compact searchable/filterable list with stock/unit labels and add FAB; preserve edit/stock actions and loading/empty states. |
| 14 New sale | `NewBill` | Reference POS cart, quick quantity controls, discount, customer selection and save/draft behavior. All totals must come from validated line math, not display strings. |
| 15 Payment | Currently embedded in `NewBill` | Add a separate payment step for cash/card/wallet/credit, received amount, change and partial due. Persist actual payment method(s) and keep customer balance/stock writes atomic. |
| 16 Customers | `CreditCustomers` | Show all customers, search and filter, balance status, add FAB; do not hide zero-balance customers. |
| 17 Customer detail | `CustomerDetail` | Add summary cards, actions, sale/payment timeline, call/message where a number exists, and edit via real customer update flow. |
| 18 Reports | `SalesReport` | Add summary, chart and drill-down rows for sales, gross/net profit, top products and low stock. Reports must work offline with clear cloud-only limits. |
| 19 Expenses | No model or screen | Add expense CRUD, categories, dates, reports and offline sync; feed net-profit calculations. |
| 20 Stock | `StockOverview` / adjustment | Product-centric stock list with low/out filters, thresholds and detail, plus existing transaction history and adjustment behavior. |
| 21 Business settings | `Settings` plus shop screens | Group shop info, type, currency/tax, units, invoice, staff, backup/sync, subscription, language, notifications, and new Theme screen. Only enable settings with backed behavior. |
| 22 Staff | No model or screen | Add staff/member roles, invite/onboarding, revoke, and server-enforced permissions before showing as functional. |
| 23 Subscription | `SubscriptionPlans` | Restyle cards using live backend plans/RevenueCat offering; never hardcode screenshot prices or plan names. |
| 24 Help | `HelpSupport` | Restyle FAQ/contact; live chat and rating need real integration or clearly scoped alternatives. |
| 25 Profile & More | `Profile`, `Settings`, drawer | Consolidate profile, plan, devices, backup/sync, privacy/terms, about and logout. Account edit needs a backend endpoint; existing `Delete Account & Data` behavior is sign-out only and must be corrected separately. |

The image omits screens already needed by this product: bill/receipt detail, stock adjustment, shops, notifications, sync status, coins, category management and error/recovery states. Restyle these with the same design system and keep them reachable.

## 5. Backend and local database work before dependent UI

1. **Shop catalog and registration:** add the missing pictured `ShopType` rows with stable codes, localized labels/icons and default stock hints. Preserve existing types and shops. Ensure registration sends `shopTypeCode`, shop details, and account details in the backend's single transaction. Add country and a shop base currency only if multi-country operations are in scope; validate currencies, format values per shop, and do not convert historic amounts by changing a preference.
2. **Product measurement:** write a unit/stock specification before changing enums. Piece/count should map to `QUANTITY`; length/area and pack retain current modes. Weight, volume, service, and custom need defined base units, allowed precision, price basis, inventory behavior, invoice line representation, and conversions. A service item must never decrement physical stock. Add Prisma and SQLite migrations, API validation, receipt fields, sync serializers, and report cost math together. Do not claim a screen supports a mode before sales and sync do.
3. **Payment methods:** add a bill-payment record or equivalent audit trail with method, amount, reference/status and timestamps. Support cash/card/wallet/credit and partial/mixed settlement. Backfill existing bills as `UNSPECIFIED` method rather than inventing cash. Reconcile `totalReceived`, `remainingDue`, customer balance, refunds/voids, and ledger reports in one transaction. Extend pull/push and receipts.
4. **Expenses:** add shop-scoped `Expense` with amount, category, date, note, optional attachment, creator, soft delete, client ID and sync metadata. Add authenticated tenant routes and local repository/migration; include expenses in sync paging and ordering. Define gross profit = sales less cost of goods, net profit = gross profit less expenses, and avoid double counting credit payments as revenue.
5. **Staff:** add shop membership, role/permission matrix, invite lifecycle and audit attribution. Enforce tenant and permission checks in backend middleware on every read/write. Decide whether staff can operate offline and how local data is isolated per account. A visual list without permission enforcement is insufficient.
6. **Settings endpoints:** add shop settings for tax, invoice numbering/branding, currency and theme only as supported by actual models. Add an admin profile update endpoint if Profile edit is offered. Consider a secure password reset service separately from the current change-password route. Add OAuth only with provider credential validation server-side.
7. **Existing parity fixes:** align low-stock threshold in Prisma/SQLite/sync and its mode-aware calculations. Confirm product images, shop logos and active shop switching. Audit account-scoped local data before staff or shared devices are enabled.

All new shop data follows the existing UUID `clientId` ↔ server integer ID mapping, tenant checks, soft-delete rules and FK-safe push/pull order. Extend sync tests for new entities and preserve existing offline writes. Never make business writes online-only merely to match a screen.

## 6. Execution order

1. **Contract and design baseline:** agree on branding, unit semantics, payment behavior, country/currency scope and staff roles. Capture a route/API/schema matrix and screen measurements from the reference. Establish semantic tokens and asset/icon map.
2. **Foundation UI:** theme presets, persisted per-shop selection, Theme settings, shared controls, bottom-tab navigation, common loading/error/empty states, Urdu direction and light/dark coverage.
3. **Onboarding and auth:** splash, four slides, business picker, shop details, account creation, login; connect to live backend type list and registration. Keep unsupported social/reset actions honest until their APIs land.
4. **Core sales/catalog:** product unit contract and migrations first, then add-product/list, POS cart, payment step, bill detail and customer screens. Verify stock and customer ledgers through offline/reconnect flows.
5. **Management:** dashboard, stock overview, reports and expenses with net-profit calculation; then business settings, profile/help/subscription and secondary screens.
6. **Staff and optional integrations:** staff security model and UI, then OAuth, password reset, live chat, rating, tax and richer invoice settings if confirmed in product scope.
7. **Release pass:** update `CODEX.md` as routes/schema/architecture change; run backend tests plus contract/sync tests, SDK 57 diagnostics and native development builds; visually compare every screen at small/large sizes in light/dark, each preset, and Urdu; exercise fresh registration, shop switch, offline sales, sync conflicts, payments, expenses, staff authorization and subscription states.

## 7. Acceptance conditions

- Every pictured destination is reachable and responds to real data or a clearly labeled unavailable state; no screenshot sample values ship as live content.
- Layout stays consistent when themes change. Theme survives restart, shop switch and (if backend persistence is implemented) login on another device; old installs retain a valid fallback.
- Business-type list reflects active backend types, while all existing types continue to work.
- Every offered product measurement can be created, sold, stocked where applicable, reported, printed and synchronized without changing its meaning.
- Sale totals, payment methods, customer dues, stock, gross profit and net profit reconcile both locally and after sync.
- Backend enforces staff roles and shop boundaries; UI visibility alone is never the access control.
- New user-visible copy has English, Urdu and Hindi translations; all palette variants pass contrast and visual checks in light/dark mode.

## 8. Decisions to confirm before dependent implementation

- Whether the screenshot's **ShopPro** name/logo replaces **AsaanKhata**, or only its visual layout/colors are desired. Current assumption: visual design only.
- Whether theme selection is **per shop and shared across devices** (recommended) or device-only.
- Which countries/currencies are actually supported. Current backend accounting is effectively PKR; a selector without accounting support would be misleading.
- Exact behavior for weight, volume, service and custom units; mixed payments/refunds; staff roles; and whether social login/live chat are required in the first release.

These decisions affect schemas and security. The rest of the visual foundation and supported screens can proceed while they are resolved.
