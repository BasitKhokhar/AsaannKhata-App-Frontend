# RevenueCat production setup

The mobile app uses RevenueCat's public platform SDK key. The backend alone
uses the private REST API key and webhook secret. Never put a secret key in the
Expo app, `app.config.js` extras, or a committed `.env` file.

## Environment variables

| Location | Variable | Value |
| --- | --- | --- |
| Frontend / EAS build environment | `REVENUECAT_ANDROID_SDK_KEY` | RevenueCat Android **public SDK** key (`goog_...`) |
| Frontend / EAS build environment | `REVENUECAT_IOS_SDK_KEY` | RevenueCat iOS **public SDK** key (`appl_...`), needed when building iOS |
| Backend server only | `REVENUECAT_API_KEY` | RevenueCat **secret** REST API key for `GET /v1/subscribers/{app_user_id}` |
| Backend server only | `REVENUECAT_WEBHOOK_SECRET` | Long random secret; set RevenueCat webhook Authorization header to `Bearer <same secret>` |
| Backend server only | `REVENUECAT_LIFETIME_PRODUCT_ID`, `REVENUECAT_CLOUD_SYNC_MONTHLY_PRODUCT_ID`, `REVENUECAT_CLOUD_SYNC_SEMIANNUAL_PRODUCT_ID`, `REVENUECAT_CLOUD_SYNC_YEARLY_PRODUCT_ID` | Exact RevenueCat product identifiers; Google Play subscriptions use `subscriptionId:basePlanId` |
| Backend server only (recommended) | `REVENUECAT_APP_IDS` | Comma-separated RevenueCat app IDs from webhook `event.app_id` (Android and iOS if both ship); rejects events from another app |

Use `.env.example` as a local frontend template. Put real values in an ignored
`.env` or the matching EAS `development`, `preview`, and `production` build
environments. Restart Metro or rebuild after changing a key. Backend values
belong only in the backend deployment's secret environment. The Android and
iOS public SDK keys may be in a distributed app; they are not server secrets.

## Dashboard and store configuration

1. Create products in Google Play Console for package
   `com.asaandukaan.app` (and App Store Connect for bundle
   `com.asaandukaan.app` if shipping iOS): lifetime non-consumable and the
   intended recurring Cloud Sync plans.
2. Import those products into the corresponding RevenueCat apps. Attach each
   product to an entitlement and add purchasable packages to the current
   offering. Set that offering as current/default for the Android app. Importing
   products alone does not register them in an offering. The app searches that
   offering by exact product identifier. For three base plans under one Play
   subscription, add one package per base plan.
   Review RevenueCat's restore/transfer behavior for different app accounts
   sharing one store account before enabling production restore.
3. Set the backend `SubscriptionPlan.revenueCatProductId` for `LIFETIME`,
   `CLOUD_SYNC_MONTHLY`, `CLOUD_SYNC_SEMIANNUAL`, and `CLOUD_SYNC_YEARLY` to
   the matching store/RevenueCat product IDs. Set the four backend product ID
   environment variables above and run `npm run seed` in the backend; this
   fills missing plan descriptions/features and syncs configured product IDs
   onto existing plan rows. Seeded plans have **null IDs and zero prices**
   without these variables; until IDs and offering packages are configured,
   paid checkout is unavailable.
   Keep product identifiers aligned across Android and iOS or introduce an
   explicit per-store mapping before publishing both stores.
   Do not deactivate a plan already owned by customers without deciding the
   revocation policy: the current reconciler excludes inactive plans, so a
   later verification can remove their access.
4. The Plans screen displays localized prices returned by RevenueCat for the
   store products. Backend catalog prices are not shown as checkout prices.
   Plan descriptions and feature lists come from backend database rows and can
   be edited through the superadmin plan API. Payment records use verified
   RevenueCat webhook prices, not the catalog price or a client-sent amount.
5. Add a RevenueCat webhook pointing at the backend's
   `/webhooks/revenuecat` endpoint and set the Authorization header described
   above. Enable production events; use a separate sandbox configuration for
   testing if appropriate. The backend returns non-2xx on processing failure
   so RevenueCat can retry.
6. Test in a signed native development/preview build with a Play test track or
   App Store sandbox. Expo Go cannot run the native billing SDK. Exercise new
   purchase, renewal, cancellation, expiration, refund, restore, reinstall,
   and account switching. Confirm the backend `/subscriptions/me` response and
   payment ledger after each test.

The app identifies RevenueCat customers with the backend numeric `Admin.id`,
not the shop ID or email. Checkout and restore are available only after login.
After a transaction the client calls authenticated `/subscriptions/verify`;
only the backend entitlement is cached for offline access. If that request
fails, the purchase is shown as pending verification, never as confirmed.
