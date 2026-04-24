# Code Framework

This page provides the minimal code foundation needed to start using the purchase plugin. Choose the tab that matches your framework.

## Cordova / Ionic (Cordova)

!INCLUDE "./sections/code-framework.src.md"

## Capacitor / Ionic (Capacitor)

If you're using Capacitor, you don't need an `index.html` with `cordova.js` or a `deviceready` listener. Instead, import the plugin directly in your TypeScript/JavaScript code.

**Install the plugin:**

```bash
npm install capacitor-plugin-cdv-purchase
npx cap sync
```

**Initialization (`src/purchase.ts` or equivalent):**

{% code title="src/purchase.ts" lineNumbers="true" %}
```typescript
import { store, ProductType, Platform, LogLevel } from 'capacitor-plugin-cdv-purchase';

/**
 * Initialize the In-App Purchase plugin.
 * Call this early in your app's lifecycle (e.g., from your root component's initialization).
 */
export async function initializePurchases() {
  // Set verbosity for development (use LogLevel.WARNING in production)
  store.verbosity = LogLevel.DEBUG;

  // Register a global error handler
  store.error((error) => {
    console.error('Store error:', error.code, error.message);
  });

  // Register products (implement in your use-case specific code)
  registerProducts();

  // Configure receipt validation
  store.validator = 'https://validator.iaptic.com/v1/validate?appName=YOUR_APP';

  // Setup event listeners
  store.when()
    .productUpdated((product) => {
      console.log('Product updated:', product.id);
      refreshUI();
    })
    .approved((transaction) => transaction.verify())
    .verified((receipt) => receipt.finish())
    .finished((transaction) => {
      console.log('Transaction finished:', transaction.transactionId);
      refreshUI();
    });

  // Initialize the store with the platforms you support
  await store.initialize([
    Platform.APPLE_APPSTORE,
    Platform.GOOGLE_PLAY,
  ]);

  console.log('Store initialized. Products:', store.products.length);
}

// --- Placeholder functions (implement per use case) ---

function registerProducts() {
  // Example:
  // store.register([{
  //   id: 'my_product',
  //   type: ProductType.PAID_SUBSCRIPTION,
  //   platform: Platform.APPLE_APPSTORE,
  // }]);
}

function refreshUI() {
  // Update your UI with product data, ownership status, etc.
}
```
{% endcode %}

**Explanation:**

1. **Direct import (Line 1):** The `capacitor-plugin-cdv-purchase` package exports the same API as the global `CdvPurchase` namespace. No need for `deviceready` or plugin availability checks.
2. **Async initialization:** The `store.initialize()` call returns a promise — use `await` or `.then()` to know when products are loaded.
3. **Same API:** Once initialized, the store works identically to the Cordova version — `store.when()`, `offer.order()`, `transaction.verify()`, etc.
4. **Framework integration:** Call `initializePurchases()` from your app's entry point (e.g., Angular `APP_INITIALIZER`, React `useEffect`, Vue `onMounted`).
