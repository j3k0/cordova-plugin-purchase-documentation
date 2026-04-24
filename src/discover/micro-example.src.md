# Micro Example

The [cordova-purchase-micro-example](https://github.com/j3k0/cordova-purchase-micro-example) repository is a collection of minimal, standalone Cordova projects that demonstrate the **CdvPurchase v13+ API** with [iaptic](https://www.iaptic.com) receipt validation.

## Repository Overview

The repo contains four independent example projects:

| Project | Description |
|---------|-------------|
| **consumables/** | Consumable products with quantity support (Apple App Store and Google Play) |
| **subscriptions/** | Auto-renewable subscriptions with expiry tracking |
| **braintree/** | Direct payments via the Braintree Drop-In UI |
| **stripe/** | Web-based payments via Stripe (using the iaptic-js platform) |

Each project is a complete Cordova app you can build and run independently. They all follow the same pattern: register products, set up event listeners, initialize the store, and react to purchase lifecycle events.

## Consumables Example Walkthrough

The `consumables/` project is the best starting point. It demonstrates the full purchase flow for consumable products (tokens, coins, credits) on both Apple App Store and Google Play.

### Step 1: Register Products

Tell the store which products your app sells, their type, and which platforms they are available on:

```javascript
const { store, ProductType, Platform } = CdvPurchase;

store.register([{
  id: 'my_consumable',
  type: ProductType.CONSUMABLE,
  platform: Platform.APPLE_APPSTORE,
}, {
  id: 'my_consumable',
  type: ProductType.CONSUMABLE,
  platform: Platform.GOOGLE_PLAY,
}]);
```

The same product ID is registered for each platform. The plugin handles platform detection automatically at runtime.

### Step 2: Configure Receipt Validation

Set up [iaptic](https://www.iaptic.com) as the receipt validator. This ensures purchases are verified server-side before granting content:

```javascript
const iaptic = new CdvPurchase.Iaptic({
  appName: 'YOUR_IAPTIC_APP_NAME',
  apiKey: 'YOUR_IAPTIC_API_KEY',
});
store.validator = iaptic.validator;
```

### Step 3: Set Up Event Listeners

The purchase lifecycle flows through a chain of events. Wire them up using `store.when()`:

```javascript
store.when()
  .productUpdated(() => renderUI())
  .approved(transaction => {
    // Purchase approved by the platform -- send for server validation
    transaction.verify();
  })
  .verified(receipt => {
    // Server confirmed the purchase is legitimate
    // Grant the content, then finish the transaction
    for (const purchase of receipt.collection) {
      grantTokens(purchase.quantity || 1);
    }
    receipt.finish();
  })
  .finished(() => renderUI());
```

The key flow is: **approved** -> `verify()` -> **verified** -> `finish()` -> **finished**.

- `approved`: The platform accepted the payment. Call `transaction.verify()` to validate the receipt with your server.
- `verified`: The server confirmed the receipt. Grant the purchased content, then call `receipt.finish()` to consume the transaction.
- `finished`: The transaction is fully processed. Update your UI.

### Step 4: Initialize the Store

Connect to the platform adapters. This triggers product loading and restores any pending transactions:

```javascript
store.initialize([
  Platform.APPLE_APPSTORE,
  Platform.GOOGLE_PLAY,
]);
```

### Step 5: Place an Order

When the user taps a "Buy" button, find the product's offer and order it:

```javascript
const offer = store.get('my_consumable')?.getOffer();
if (offer) {
  store.order(offer);
}
```

This launches the native purchase UI. The result flows back through the event listeners configured in Step 3.

### Error Handling

Register a global error handler to catch store-level issues:

```javascript
store.error(error => {
  if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) return;
  console.error(`Store error ${error.code}: ${error.message}`);
});
```

## Subscriptions Example

The `subscriptions/` project follows the same pattern but uses `ProductType.PAID_SUBSCRIPTION`. It adds:

- Subscription status tracking via `product.owned` and `store.findInVerifiedReceipts()`
- Expiry date display from the verified receipt
- Support for multi-phase pricing (trials, introductory offers) through `offer.pricingPhases`

The event chain is identical but simpler -- subscriptions do not require quantity tracking:

```javascript
store.when()
  .approved(transaction => transaction.verify())
  .verified(receipt => receipt.finish())
  .finished(() => renderUI());
```

## Braintree Example

The `braintree/` project demonstrates direct payments (not tied to app store products) using the Braintree Drop-In UI. Key differences:

- No `store.register()` call -- products are defined at payment time
- Uses `store.requestPayment()` to launch a payment flow with custom items and pricing
- Iaptic provides the Braintree client token automatically via `iaptic.braintreeClientTokenProvider`

## Stripe Example

The `stripe/` project shows web-based payments via Stripe, using `Platform.IAPTIC_JS`. This works in both browser and Cordova environments. Products are defined in your iaptic dashboard and linked to your Stripe account.

## Running the Examples

```bash
git clone https://github.com/j3k0/cordova-purchase-micro-example.git
cd cordova-purchase-micro-example/consumables
npm install
npx cordova platform add ios    # or android
npx cordova build ios           # or android
```

Before building, update the placeholder values in `www/js/env.ts`:
- Product IDs matching your App Store / Google Play configuration
- Your iaptic app name and API key
- Your app's bundle identifier in `config.xml`

Each project uses TypeScript. After editing `www/js/index.ts`, compile with `npx tsc www/js/index.ts`.

## Next Steps

- [Consumable (AppStore)](../use-cases/consumable-appstore.md) -- detailed iOS/macOS setup for consumables
- [Consumable (Google Play)](../use-cases/consumable-googleplay.md) -- Google Play configuration
- [Subscription (AppStore)](../use-cases/subscription-appstore.md) -- subscription setup for iOS/macOS
- [Subscription (Google Play)](../use-cases/subscription-googleplay.md) -- subscription setup for Android
- [Using the Test Platform](../use-cases/test-platform.md) -- develop without store accounts
