# IapticJS Adapter

The IapticJS adapter (`CdvPurchase.Platform.IAPTIC_JS`) allows your application to use [iaptic-js](https://www.iaptic.com) as a payment platform directly within the plugin. Instead of using a traditional validator URL with native store purchases, this adapter handles the full purchase flow through iaptic's Stripe-based payment system.

**Availability:** v13.12.0+

## When to Use

The IapticJS adapter is suited for:

- **Web-based purchases** — process payments via Stripe in browser or PWA environments where native stores are unavailable
- **Cross-platform entitlements** — combine native store purchases (iOS/Android) with web-based Stripe purchases under one unified API
- **Subscription management** — leverage Stripe's billing infrastructure while using the same CdvPurchase event model

## Prerequisites

1. An [iaptic](https://www.iaptic.com) account with Stripe configured
2. The `iaptic-js` SDK loaded in your HTML (before the plugin initializes)

```html
<script src="https://cdn.iaptic.com/iaptic-js/v1/iaptic.js"></script>
```

## Setup

Register products with `Platform.IAPTIC_JS` and initialize the store with the adapter configuration:

```javascript
const { store, ProductType, Platform } = CdvPurchase;

// Register products (IDs must match your iaptic dashboard)
store.register([{
    id: 'premium_monthly',
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.IAPTIC_JS
}]);

// Set up event handlers
store.when()
    .approved(transaction => transaction.verify())
    .verified(receipt => receipt.finish())
    .finished(transaction => unlockPremium());

// Initialize with iaptic-js configuration
await store.initialize([{
    platform: Platform.IAPTIC_JS,
    options: {
        type: 'stripe',
        appName: 'your-app-name',
        apiKey: 'your-iaptic-public-key'
    }
}]);
```

## How It Works

1. **Product loading** — the adapter fetches available products and pricing from iaptic's API
2. **Order** — calling `store.order(offer)` redirects the user to a Stripe Checkout page
3. **Completion** — after payment, the user is redirected back; the adapter fetches updated purchases using a stored access token
4. **Verification** �� purchases are already server-validated by iaptic; `transaction.verify()` confirms the purchase state

## Purchasing

The purchase flow uses Stripe Checkout (redirect-based):

```javascript
const product = store.get('premium_monthly');
const offer = product && product.getOffer();

if (offer) {
    // This redirects to Stripe Checkout
    const error = await store.order(offer);
    if (error) {
        console.log('Order initiation failed: ' + error.message);
    }
    // User will be redirected to Stripe, then back to your app
}
```

After the user completes payment on Stripe, they are redirected back to your application URL. The adapter detects the return and loads the updated purchase state automatically.

## Checking Purchase State

Purchases are exposed through the standard plugin receipt/transaction model:

```javascript
store.when().verified(receipt => {
    receipt.collection.forEach(purchase => {
        console.log(purchase.id + ' - expires: ' + purchase.expiryDate);
    });
    receipt.finish();
});
```

## Combining with Native Platforms

You can use the IapticJS adapter alongside native platforms to support both web and mobile purchases:

```javascript
store.register([
    { id: 'premium', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.APPLE_APPSTORE },
    { id: 'premium', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
    { id: 'premium_monthly', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.IAPTIC_JS }
]);

// Initialize all platforms
await store.initialize([
    Platform.APPLE_APPSTORE,
    Platform.GOOGLE_PLAY,
    { platform: Platform.IAPTIC_JS, options: { type: 'stripe', appName: '...', apiKey: '...' } }
]);
```

## Notes

- The adapter requires the global `window.IapticJS` object to be available (loaded via the script tag above).
- Product IDs in your store registration should match those configured in your iaptic dashboard.
- The adapter does not support `requestPayment` or `orderQuantity` capabilities.
- Access tokens are stored locally; if the token becomes invalid, the adapter clears local data and the user must re-authenticate through a new purchase.
