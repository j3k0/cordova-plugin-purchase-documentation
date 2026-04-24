# Capacitor Setup

This guide covers installing and configuring the In-App Purchase plugin for **Capacitor 6+** projects using the dedicated `capacitor-plugin-cdv-purchase` package.

Since v13.15, Capacitor has its own native bridges (StoreKit 2 on iOS, Google Play Billing on Android) with no dependency on Cordova. The JavaScript API (`CdvPurchase.store`) remains identical to the Cordova version.

## Installation

```bash
npm install capacitor-plugin-cdv-purchase
npx cap sync
```

That's it. No additional native plugin installation is required — `cap sync` handles the native bridge registration automatically.

### Migrating from cordova-plugin-purchase in a Capacitor project

If you previously used `cordova-plugin-purchase` inside a Capacitor app (via Cordova compatibility layer):

1. Remove the old plugin:
   ```bash
   npm uninstall cordova-plugin-purchase
   npm uninstall cordova-plugin-purchase-storekit2  # if installed
   ```
2. Install the Capacitor-native package:
   ```bash
   npm install capacitor-plugin-cdv-purchase
   npx cap sync
   ```
3. Update your import (if using ES modules):
   ```typescript
   // Before:
   // import 'cordova-plugin-purchase';
   // const { store } = CdvPurchase;

   // After:
   import { store, ProductType, Platform } from 'capacitor-plugin-cdv-purchase';
   ```

The API surface is the same — no other code changes are needed.

## Platform Support

| Platform | Native API | Minimum OS |
|----------|-----------|------------|
| iOS      | StoreKit 2 | iOS 15+    |
| Android  | Google Play Billing 8.3 | API 23+ |

## Differences from Cordova Setup

| Aspect | Cordova | Capacitor |
|--------|---------|-----------|
| Package name | `cordova-plugin-purchase` | `capacitor-plugin-cdv-purchase` |
| Install command | `cordova plugin add cordova-plugin-purchase` | `npm install capacitor-plugin-cdv-purchase && npx cap sync` |
| iOS native layer | StoreKit 2 via separate plugin (`cordova-plugin-purchase-storekit2`) | StoreKit 2 built-in |
| Initialization trigger | `document.addEventListener('deviceready', ...)` | Import directly; no `deviceready` needed |
| Plugin access | Global `window.CdvPurchase.store` | `import { store } from 'capacitor-plugin-cdv-purchase'` |

## Initialization Example

```typescript
import { store, ProductType, Platform, LogLevel } from 'capacitor-plugin-cdv-purchase';

// Set verbosity for development
store.verbosity = LogLevel.DEBUG;

// Register your products
store.register([{
  id: 'my_subscription',
  type: ProductType.PAID_SUBSCRIPTION,
  platform: Platform.APPLE_APPSTORE,
}, {
  id: 'my_subscription',
  type: ProductType.PAID_SUBSCRIPTION,
  platform: Platform.GOOGLE_PLAY,
}]);

// Configure receipt validation
store.validator = 'https://validator.iaptic.com/v1/validate?appName=YOUR_APP';

// Setup event listeners
store.when()
  .productUpdated((product) => {
    console.log('Product updated:', product.id, product.title, product.pricing);
  })
  .approved((transaction) => transaction.verify())
  .verified((receipt) => receipt.finish())
  .finished((transaction) => {
    console.log('Transaction finished:', transaction.transactionId);
  });

// Register error handler
store.error((error) => {
  console.error('Store error:', error.code, error.message);
});

// Initialize the store
await store.initialize([
  Platform.APPLE_APPSTORE,
  Platform.GOOGLE_PLAY,
]);
```

**Key difference:** In Capacitor, you import the plugin directly as an ES module. There is no need to wait for a `deviceready` event or check for `window.CdvPurchase` — the import itself guarantees the API is available.

## Platform Configuration

### iOS

No additional native configuration is needed beyond Xcode's standard In-App Purchase capability:

1. Open your project in Xcode (`npx cap open ios`).
2. Select your app target, go to **Signing & Capabilities**.
3. Click **+ Capability** and add **In-App Purchase**.

### Android

No extra Gradle or manifest changes are required. The plugin automatically includes the Google Play Billing Library dependency.

Ensure your `android/app/build.gradle` has `minSdkVersion` of 23 or higher (the Capacitor default satisfies this).

## Recommended Companion Packages

- **`@capacitor/network`** — Allows the purchase plugin to detect connectivity changes for faster retry of failed validation requests:
  ```bash
  npm install @capacitor/network
  npx cap sync
  ```

## Next Steps

Once installed, the API usage is identical across Cordova and Capacitor. Continue with:

- [Initial Framework](./code-framework.md) for a full code skeleton
- The [Use Cases](../use-cases/product-types/README.md) section for product-specific guides
- [Receipt Validation Importance](../discover/receipt-validation-importance.md) for why server-side validation matters
