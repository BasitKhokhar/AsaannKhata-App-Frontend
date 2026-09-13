// English — source of truth for every key. src/i18n/ur.js and src/i18n/hi.js
// must define every key that exists here; src/store/languageStore.js falls
// back to this file (then to the raw key) for anything missing in the
// active language. Flat key -> string map, grouped by screen/feature via a
// dotted key prefix (not a nested object — see languageStore.js's t()).
export const en = {
  // ---------------------------------------------------------------------
  // Common / shared UI
  // ---------------------------------------------------------------------
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.retry': 'Retry',
  'common.loading': 'Loading…',
  'common.done': 'Done',
  'common.search': 'Search',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.ok': 'OK',
  'common.error': 'Something went wrong',
  'common.success': 'Success',
  'common.close': 'Close',
  'common.justNow': 'just now',
  'common.minutesAgo': '{count} min ago',
  'common.hourAgo': '{count} hour ago',
  'common.hoursAgo': '{count} hours ago',
  'common.dayAgo': '{count} day ago',
  'common.daysAgo': '{count} days ago',
  'common.weekAgo': '{count} week ago',
  'common.weeksAgo': '{count} weeks ago',

  // ---------------------------------------------------------------------
  // Navigation / drawer
  // ---------------------------------------------------------------------
  'nav.dashboard': 'Dashboard',
  'nav.billing': 'Billing',
  'nav.products': 'Products',
  'nav.stock': 'Stock',
  'nav.creditCustomers': 'Credit Customers',
  'nav.reports': 'Reports',
  'nav.myShops': 'My Shops',
  'nav.notifications': 'Notifications',
  'nav.subscription': 'Subscription',
  'nav.settings': 'Settings',
  'nav.watchTutorial': 'Watch Tutorial',
  'nav.selectShop': 'Select a shop',
  'nav.switchShop': 'Switch shop',
  'nav.account': 'Account',

  // ---------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------
  'dashboard.salesToday': 'Sales today',
  'dashboard.profitToday': 'Profit today',
  'dashboard.totalStockValue': 'Total stock value',
  'dashboard.dailyUsage': 'Daily usage',
  'dashboard.earnCoins': 'Earn coins',
  'dashboard.billsToday': 'Bills today',
  'dashboard.adsWatchedToday': 'Ads watched today',
  'dashboard.revenueThisWeek': 'Revenue this week',
  'dashboard.topLowStocked': 'Top 5 low stocked items',
  'dashboard.nothingLowStock': 'Nothing low on stock right now.',
  'dashboard.topProducts': 'Top products',
  'dashboard.syncedData': 'Synced data',
  'dashboard.couldntLoad': "Couldn't load — check your connection.",
  'dashboard.noSalesYet': 'No sales yet for this shop.',
  'dashboard.recentInvoices': 'Recent invoices',
  'dashboard.noInvoicesYet': 'No invoices yet.',
  'dashboard.paid': 'Paid',
  'dashboard.pending': 'Pending',
  'dashboard.notSyncedYet': 'Not synced yet',
  'dashboard.syncedRelative': 'Synced {time}',
  'dashboard.out': 'Out',
  'dashboard.left': '{count} left',

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.profileDesc': 'Your account & shop details',
  'settings.notifications': 'Notifications',
  'settings.notificationsDesc': 'In-app alert preferences',
  'settings.syncStatus': 'Sync Status',
  'settings.syncStatusDesc': 'Cloud sync & linked devices',
  'settings.earnCoins': 'Earn Coins',
  'settings.earnCoinsDesc': 'Watch ads to earn coins & unlock sync',
  'settings.helpSupport': 'Help & Support',
  'settings.helpSupportDesc': 'FAQs and contact',
  'settings.about': 'About, Terms & Privacy',
  'settings.aboutDesc': 'Version & legal',
  'settings.language': 'Language',
  'settings.languageDesc': 'Choose app language',
  'settings.chooseLanguage': 'Choose language',
  'settings.theme': 'Theme',
  'settings.themeSystem': 'System',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.deleteAccount': 'Delete Account & Data',
  'settings.deleteAccountConfirmTitle': 'Delete Account & Data',
  'settings.deleteAccountConfirmMessage':
    "This removes your session from this device and signs you out. Full server-side account deletion isn't available yet — contact support if you need your account permanently erased.",
  'settings.confirmSignOut': 'Sign Out & Clear Session',
  'settings.logout': 'Log Out',

  // ---------------------------------------------------------------------
  // Notifications (push inbox + in-app alert prefs, same screen)
  // ---------------------------------------------------------------------
  'notifications.inboxTitle': 'Notifications',
  'notifications.inboxSubtitle': 'Updates from your account',
  'notifications.markAllRead': 'Mark all read',
  'notifications.empty': "You're all caught up — no notifications yet.",
  'notifications.loadMore': 'Load more',
  'notifications.couldntLoad': "Couldn't load notifications — check your connection.",
  'notifications.alertsSectionTitle': 'Alerts',
  'notifications.subtitle': 'In-app alert preferences',
  'notifications.lowStockAlerts': 'Low Stock Alerts',
  'notifications.lowStockAlertsDesc': 'Notify when product quantity drops below threshold',
  'notifications.syncStatusAlerts': 'Sync Status Alerts',
  'notifications.syncStatusAlertsDesc': 'Notify when a shop fails to sync or falls behind',
  'notifications.khataDueReminders': 'Khata Due Reminders',
  'notifications.khataDueRemindersDesc': "Notify when a customer's credit balance is due",

  // ---------------------------------------------------------------------
  // Auth — Login
  // ---------------------------------------------------------------------
  'auth.login.welcomeBack': 'Welcome back',
  'auth.login.subtitle': 'Log in to manage your shops.',
  'auth.login.emailOrPhone': 'Email or phone',
  'auth.login.password': 'Password',
  'auth.login.forgotPassword': 'Forgot password?',
  'auth.login.logIn': 'Log In',
  'auth.login.newToApp': 'New to AsaanKhata?',
  'auth.login.register': 'Register',
  'auth.login.genericError': 'Could not log in. Check your details and try again.',

  // ---------------------------------------------------------------------
  // Auth — Register wizard
  // ---------------------------------------------------------------------
  'auth.register.createAccount': 'Create Account',
  'auth.register.stepOf': 'STEP {step} OF 3',
  'auth.register.stepYourAccount': 'YOUR ACCOUNT',
  'auth.register.stepFirstShop': 'FIRST SHOP',
  'auth.register.stepChoosePlan': 'CHOOSE A PLAN',

  'auth.register1.fullName': 'Full name',
  'auth.register1.email': 'Email',
  'auth.register1.phone': 'Phone',
  'auth.register1.password': 'Password',
  'auth.register1.confirmPassword': 'Confirm password',
  'auth.register1.continue': 'Continue',
  'auth.register1.errorRequired': 'Please fill in your name, email, and password.',
  'auth.register1.errorPasswordMismatch': 'Passwords do not match.',

  'auth.register2.shopName': 'Shop name',
  'auth.register2.addLogo': 'Add shop logo',
  'auth.register2.addLogoOptional': 'Optional — you can add this later',
  'auth.register2.shopType': 'Shop type',
  'auth.register2.continue': 'Continue',
  'auth.register2.errorRequired': 'Please name your shop and choose a shop type.',

  'auth.register3.freeTrialTitle': 'Free Trial',
  'auth.register3.freeTrialBlurb': 'Full features, no card required',
  'auth.register3.lifetimeTitle': 'Lifetime',
  'auth.register3.lifetimeBlurb': 'One-time payment, single device',
  'auth.register3.cloudSyncTitle': 'Cloud Sync',
  'auth.register3.cloudSyncBlurb': 'Monthly / semiannual / yearly · multi-device',
  'auth.register3.recommended': 'RECOMMENDED',
  'auth.register3.trialDaysFree': '{days} days free',
  'auth.register3.agreePrefix': 'I agree to the',
  'auth.register3.termsOfService': 'Terms of Service',
  'auth.register3.and': 'and',
  'auth.register3.privacyPolicy': 'Privacy Policy',
  'auth.register3.createAccount': 'Create Account',
  'auth.register3.errorAgree': 'Please agree to the Terms of Service and Privacy Policy.',
  'auth.register3.genericError': 'Could not create your account.',

  // ---------------------------------------------------------------------
  // Auth — Forgot password / OTP
  // ---------------------------------------------------------------------
  'auth.forgotPassword.title': 'Forgot password?',
  'auth.forgotPassword.subtitle': "Enter the email linked to your account and we'll send a 6-digit reset code.",
  'auth.forgotPassword.email': 'Email',
  'auth.forgotPassword.sendResetCode': 'Send Reset Code',
  'auth.forgotPassword.comingSoon': 'Password reset is coming soon.',
  'auth.forgotPassword.rememberedIt': 'Remembered it?',
  'auth.forgotPassword.logIn': 'Log In',

  'auth.otp.title': 'Enter verification code',
  'auth.otp.subtitle': 'We sent a 6-digit code to your email.',
  'auth.otp.resendIn': 'Resend code in',
  'auth.otp.verify': 'Verify',
  'auth.otp.comingSoon': 'OTP verification is coming soon.',

  // ---------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------
  'onboarding.skip': 'Skip',
  'onboarding.back': 'Back',
  'onboarding.next': 'Next',
  'onboarding.getStarted': 'Get Started',

  'onboarding.slide1.title': 'Run every kind of shop,\none app',
  'onboarding.slide1.description': 'General stores, pharmacies, hardware, boutiques — AsaanKhata adapts to your business.',
  'onboarding.slide2.title': 'Track quantity, area, length,\nor packs — your way',
  'onboarding.slide2.description': 'Set the stock mode once per shop. Billing and inventory adapt automatically.',
  'onboarding.slide3.title': 'Bill customers, track khata,\nget paid',
  'onboarding.slide3.description': 'Take partial payments and keep a running credit ledger for every customer.',
  'onboarding.slide4.title': 'Work offline, sync\nacross your devices',
  'onboarding.slide4.description': "Every shop works without internet, and syncs the moment you're back online.",

  // ---------------------------------------------------------------------
  // Billing / New Bill (key labels — dictionary coverage only, see the
  // engineering summary for wiring status)
  // ---------------------------------------------------------------------
  'billing.newBill': 'New Bill',
  'billing.addProductToCart': 'Add product to cart',
  'billing.subtotal': 'Subtotal',
  'billing.overallDiscount': 'Overall discount',
  'billing.total': 'Total',
  'billing.amountReceived': 'Amount received',
  'billing.remainingDue': 'Remaining due (khata)',
  'billing.completeBill': 'Complete Bill',
  'billing.addProduct': 'Add Product',
  'billing.searchProducts': 'Search products',
  'billing.noProductsFound': 'No products found',
  'billing.addAtLeastOneProduct': 'Add at least one product to the cart.',

  // ---------------------------------------------------------------------
  // Billing / Bill Detail
  // ---------------------------------------------------------------------
  'billing.billDetail.title': 'Bill #{id}',
  'billing.billDetail.print': 'Print',
  'billing.billDetail.share': 'Share',
  'billing.billDetail.paid': 'PAID',
  'billing.billDetail.pendingDue': 'PENDING · {amount} DUE',
  'billing.billDetail.discount': 'Discount',

  // ---------------------------------------------------------------------
  // Billing / Credit Customers
  // ---------------------------------------------------------------------
  'billing.creditCustomers.totalOutstanding': 'Total credit outstanding',
  'billing.creditCustomers.emptyTitle': 'No credit customers yet',
  'billing.creditCustomers.emptyDescription': 'Add a customer to start tracking their khata balance.',
  'billing.creditCustomers.addCustomer': 'Add Customer',
  'billing.creditCustomers.lastActivity': 'Last: {time}',
  'billing.creditCustomers.name': 'Name',
  'billing.creditCustomers.phoneOptional': 'Phone (optional)',
  'billing.creditCustomers.saveCustomer': 'Save Customer',
  'billing.creditCustomers.customerAdded': 'Customer added',

  // ---------------------------------------------------------------------
  // Billing / Customer Detail
  // ---------------------------------------------------------------------
  'billing.customerDetail.outstandingBalance': 'Outstanding balance',
  'billing.customerDetail.allSettledUp': 'All settled up',
  'billing.customerDetail.recordPayment': 'Record Payment',
  'billing.customerDetail.history': 'History',
  'billing.customerDetail.noActivity': 'No activity yet.',
  'billing.customerDetail.billAmount': 'Bill · {amount}',
  'billing.customerDetail.paymentReceived': 'Payment received',
  'billing.customerDetail.savePayment': 'Save Payment',
  'billing.customerDetail.amount': 'Amount',
  'billing.customerDetail.paymentRecorded': 'Payment of {amount} recorded',

  // ---------------------------------------------------------------------
  // Catalog / Add Product
  // ---------------------------------------------------------------------
  'catalog.addProduct.title': 'Add Product',
  'catalog.addProduct.changePhoto': 'Change photo',
  'catalog.addProduct.addPhotoOptional': 'Add photo (optional)',
  'catalog.addProduct.productName': 'Product name',
  'catalog.addProduct.category': 'Category',
  'catalog.addProduct.stockMode': 'Stock mode',
  'catalog.addProduct.modeQty': 'Qty',
  'catalog.addProduct.modeArea': 'Area',
  'catalog.addProduct.modeLength': 'Length',
  'catalog.addProduct.modePack': 'Pack',
  'catalog.addProduct.areaFields': 'AREA FIELDS',
  'catalog.addProduct.width': 'Width',
  'catalog.addProduct.height': 'Height',
  'catalog.addProduct.sheetsInStock': 'Number of sheets in stock',
  'catalog.addProduct.lengthFields': 'LENGTH FIELDS',
  'catalog.addProduct.currentStock': 'Current stock',
  'catalog.addProduct.packFields': 'PACK FIELDS',
  'catalog.addProduct.unitsPerPack': 'Units per pack',
  'catalog.addProduct.fullPacks': 'Full packs',
  'catalog.addProduct.looseUnits': 'Loose units',
  'catalog.addProduct.packPurchasePriceOptional': 'Pack purchase price (optional)',
  'catalog.addProduct.packSalePriceOptional': 'Pack sale price (optional)',
  'catalog.addProduct.purchasePrice': 'Purchase price',
  'catalog.addProduct.salePrice': 'Sale price',
  'catalog.addProduct.perUnit': 'per {unit}',
  'catalog.addProduct.lowStockThresholdOptional': 'Low stock threshold (optional)',
  'catalog.addProduct.saveProduct': 'Save Product',
  'catalog.addProduct.errorNameAndPrices': 'Please fill in the product name and prices.',
  'catalog.addProduct.errorSheetDims': 'Please enter sheet width and height.',
  'catalog.addProduct.errorPhotoPermission': 'Permission to access photos is required to add a product image.',

  // ---------------------------------------------------------------------
  // Catalog / Products List
  // ---------------------------------------------------------------------
  'catalog.productsList.filterAll': 'All',
  'catalog.productsList.filterLowStock': 'Low stock',
  'catalog.productsList.emptyTitle': 'No products yet',
  'catalog.productsList.emptyDescription': 'Add your first product to start billing customers and tracking stock.',
  'catalog.productsList.outOfStock': 'Out of stock',

  // ---------------------------------------------------------------------
  // Stock / Overview
  // ---------------------------------------------------------------------
  'stock.overview.totalSkus': 'Total SKUs',
  'stock.overview.lowStock': 'Low stock',
  'stock.overview.transactionHistory': 'Transaction history',
  'stock.overview.filterAll': 'All',
  'stock.overview.filterStockIn': 'Stock In',
  'stock.overview.filterStockOut': 'Stock Out',
  'stock.overview.filterPackBreak': 'Pack Break',
  'stock.overview.emptyTitle': 'No stock movements yet',
  'stock.overview.emptyDescription': 'Stock In, Stock Out, and pack-break adjustments will show up here as an audit trail.',
  'stock.overview.adjustStock': 'Adjust Stock',
  'stock.overview.pickerTitle': 'Adjust which product?',
  'stock.overview.noProductsMatch': 'No products match your search.',

  // ---------------------------------------------------------------------
  // Stock / Adjustment
  // ---------------------------------------------------------------------
  'stock.adjustment.title': 'Adjust Stock',
  'stock.adjustment.currentStockLabel': 'Current stock: {stock}',
  'stock.adjustment.quantity': 'Quantity',
  'stock.adjustment.newValue': 'New: {value}',
  'stock.adjustment.reason': 'Reason',
  'stock.adjustment.noteOptional': 'Note (optional)',
  'stock.adjustment.saveAdjustment': 'Save Adjustment',
  'stock.adjustment.errorQuantity': 'Enter a quantity greater than zero.',
  'stock.unitsLeft': '{count} units left',
  'stock.areaInStock': '{count} ft² in stock',
  'stock.lengthInStock': '{count} m in stock',
  'stock.packInStock': '{count} packs + {loose} loose',

  // ---------------------------------------------------------------------
  // Reports / Sales Report
  // ---------------------------------------------------------------------
  'reports.sales.periodWeek': 'This Week',
  'reports.sales.periodMonth': 'This Month',
  'reports.sales.periodYear': 'This Year',
  'reports.sales.yearlyNote': "Year-long trends are computed on the server from synced data — run a sync first if this looks empty.",
  'reports.sales.monthlyRevenueMargin': 'Monthly revenue & margin',
  'reports.sales.noSyncedDataYear': 'No synced sales data for this year yet.',
  'reports.sales.marginLabel': '{revenue} · {margin}% margin',
  'reports.sales.netProfit': 'Net Profit',
  'reports.sales.revenue': 'Revenue',
  'reports.sales.bills': 'Bills',
  'reports.sales.noSalesPeriod': 'No sales in this period yet.',
  'reports.sales.exportReport': 'Export Report',
  'reports.sales.reportTitle': 'Sales Report — {period}',

  // ---------------------------------------------------------------------
  // Home / Shops List & Add Shop
  // ---------------------------------------------------------------------
  'home.shopsList.emptyTitle': 'No shops yet.',
  'home.shopsList.addShop': 'Add Shop',
  'home.shopsList.active': 'ACTIVE',
  'home.shopsList.defaultShopType': 'Shop',

  'home.addShop.title': 'Add Shop',
  'home.addShop.shopName': 'Shop name',
  'home.addShop.addressOptional': 'Address (optional)',
  'home.addShop.phoneOptional': 'Phone (optional)',
  'home.addShop.saveShop': 'Save Shop',
  'home.addShop.genericError': 'Could not create shop. Are you online?',

  // ---------------------------------------------------------------------
  // Settings / Profile
  // ---------------------------------------------------------------------
  'settings.profile.accountId': 'Account ID: {id}',
  'settings.profile.defaultName': 'Shop Owner',
  'settings.profile.noEmail': 'No email on file',
  'settings.profile.shopManagement': 'Shop Management',
  'settings.profile.myShopsDesc': 'View, edit, or add shops',
  'settings.profile.changePassword': 'Change Password',
  'settings.profile.changePasswordDesc': 'Update the password used to sign in to AsaanKhata.',
  'settings.profile.currentPassword': 'Current password',
  'settings.profile.newPassword': 'New password',
  'settings.profile.newPasswordHint': 'At least 6 characters',
  'settings.profile.updatePassword': 'Update Password',
  'settings.profile.passwordUpdated': 'Password updated',
  'settings.profile.errorFillBoth': 'Enter your current and new password.',
  'settings.profile.errorMinLength': 'New password must be at least 6 characters.',
  'settings.profile.errorGeneric': 'Could not update password. Check your current password and try again.',

  // ---------------------------------------------------------------------
  // Settings / About
  // ---------------------------------------------------------------------
  'settings.about.tagline': 'Every Shop. One App.',
  'settings.about.version': 'Version {version}',
  'settings.about.legal': 'Legal',
  'settings.about.comingSoon': 'Coming soon',
  'settings.about.copyright': '© {year} AsaanKhata. All rights reserved.',

  // ---------------------------------------------------------------------
  // Settings / Help & Support
  // ---------------------------------------------------------------------
  'settings.helpSupport.faqTitle': 'Frequently Asked Questions',
  'settings.helpSupport.faqAddProductQ': 'How do I add a product?',
  'settings.helpSupport.faqAddProductA':
    'Go to Stock from the menu, tap the + button, and fill in the product name, price, quantity, and category. You can add a photo too.',
  'settings.helpSupport.faqKhataQ': 'How does khata/credit tracking work?',
  'settings.helpSupport.faqKhataA':
    'Open a customer from Customers, tap "Add to Khata" to record credit given, or "Record Payment" when they pay it back. The running balance updates automatically.',
  'settings.helpSupport.faqSyncQ': 'How do I sync across devices?',
  'settings.helpSupport.faqSyncA':
    'Cloud Sync keeps your data backed up and available on multiple devices on eligible plans. Turn it on from Sync Status in Settings, then sign in on your other device.',
  'settings.helpSupport.faqOfflineQ': 'What happens if I lose internet?',
  'settings.helpSupport.faqOfflineA':
    "AsaanKhata works fully offline — bills, stock, and khata entries save to this device instantly and sync to the cloud automatically once you're back online.",
  'settings.helpSupport.faqMultiShopQ': 'Can I use AsaanKhata for more than one shop?',
  'settings.helpSupport.faqMultiShopA':
    'Yes. Add additional shops from Profile → My Shops, and switch between them from the shop selector in the app menu.',
  'settings.helpSupport.contactUs': 'Contact Us',
  'settings.helpSupport.emailSupport': 'Email Support',
  'settings.helpSupport.noPhoneSupport': 'No phone support line is set up yet — email is the fastest way to reach us for now.',

  // ---------------------------------------------------------------------
  // Settings / Sync Status
  // ---------------------------------------------------------------------
  'settings.syncStatus.notActiveTitle': "Cloud Sync isn't active",
  'settings.syncStatus.notActiveDescription':
    'Your plan works fully offline on this device. Upgrade to Cloud Sync to back up and sync across multiple devices.',
  'settings.syncStatus.upgradeButton': 'Upgrade to Cloud Sync',
  'settings.syncStatus.syncing': 'Syncing…',
  'settings.syncStatus.allSynced': 'All shops synced',
  'settings.syncStatus.lastSynced': 'Last synced: {time}',
  'settings.syncStatus.never': 'never',
  'settings.syncStatus.statusSynced': 'Synced',
  'settings.syncStatus.statusError': 'Error',
  'settings.syncStatus.statusQueued': 'Queued (offline)',
  'settings.syncStatus.devices': 'Devices',
  'settings.syncStatus.devicesUsed': '{active} of {max} devices used',
  'settings.syncStatus.loadingDeviceUsage': 'Loading device usage…',
  'settings.syncStatus.plan': 'Plan: {tier}',
  'settings.syncStatus.syncNow': 'Sync Now',

  // ---------------------------------------------------------------------
  // Subscription / Earn Coins
  // ---------------------------------------------------------------------
  'subscription.earnCoins.coinBalance': 'Your coin balance',
  'subscription.earnCoins.watchAdSectionTitle': 'Watch ad to earn coins',
  'subscription.earnCoins.exhausted': "You've watched all the ads available for today — come back tomorrow.",
  'subscription.earnCoins.watchDescription': 'Watch a short ad to earn {coins} coins. {remaining} of {max} left today.',
  'subscription.earnCoins.watchAdButton': 'Watch ad to earn coins',
  'subscription.earnCoins.cooldownWarning': 'Too many ads watched in a row — try again in a bit.',
  'subscription.earnCoins.unlockSyncTitle': 'Unlock sync now',
  'subscription.earnCoins.coinsBadge': '{count} coins',
  'subscription.earnCoins.unlockDescription':
    'You have {count} records waiting to sync. Spend coins to unlock cloud sync without upgrading your plan.',
  'subscription.earnCoins.toastEarned': '+{coins} coins earned!',
  'subscription.earnCoins.toastClosedEarly': 'Ad closed before finishing — no coins earned.',
  'subscription.earnCoins.toastCooldown': 'Take a short break before watching more ads.',
  'subscription.earnCoins.toastDailyCap': "You've reached today's ad limit.",
  'subscription.earnCoins.toastNotReady': 'Ad not ready yet — try again in a moment.',
  'subscription.earnCoins.toastGenericFail': 'Could not show an ad right now.',
  'subscription.earnCoins.toastSyncUnlocked': 'Sync unlocked!',
  'subscription.earnCoins.toastNotEnoughCoins': 'Not enough coins yet — watch more ads to earn some.',
  'subscription.earnCoins.toastUnlockFail': 'Could not unlock sync right now.',

  // ---------------------------------------------------------------------
  // Subscription / Plans
  // ---------------------------------------------------------------------
  'subscription.plans.title': 'Plans',
  'subscription.plans.cloudSyncFeature': 'Cloud sync across devices',
  'subscription.plans.offlineFeature': 'Offline on this device',
  'subscription.plans.maxDevices': 'Up to {count} devices',
  'subscription.plans.currentPlan': 'CURRENT PLAN',
  'subscription.plans.billedCycle': 'billed {cycle}',
  'subscription.plans.manageSubscription': 'Manage Subscription',
  'subscription.plans.restorePurchases': 'Restore Purchases',
  'subscription.plans.continueButton': 'Continue',
  'subscription.plans.planUnavailable': 'This plan is not yet available for purchase — check back soon.',
  'subscription.plans.purchaseFailed': 'Purchase could not be completed.',
  'subscription.plans.subscriptionUpdated': 'Subscription updated!',
  'subscription.plans.purchasesRestored': 'Purchases restored.',
  'subscription.plans.restoreFailed': 'Could not restore purchases.',
};
