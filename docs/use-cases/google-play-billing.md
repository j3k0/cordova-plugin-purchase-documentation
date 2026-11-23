---
title: "Google Play Billing 9 Features"
sidebar_position: 14
---


As of plugin v13.17.0, the plugin uses Google Play Billing Library 9.0.0. The behaviors and capabilities below were first introduced when v13.13.0 upgraded to Billing Library 8.3.0 and remain in effect on 9.0.0.

**Requirement:** `minSdkVersion` 23 or higher (Android 6.0+).

## One-Time Product Offers

Google Play now supports multiple offers for one-time (INAPP) products, similar to how subscriptions have base plans and offers. This is called the "v12.0 format" in Google's documentation.

When a one-time product has multiple offers, each offer has its own pricing and offer token:

```javascript
const product = store.get('premium_upgrade');

// The product may have multiple offers
if (product) {
    product.offers.forEach(offer => {
        console.log('Offer: ' + offer.id);
        offer.pricingPhases.forEach(phase => {
            console.log('  Price: ' + phase.price + ' (' + phase.currency + ')');
        });
    });
}
```

To purchase a specific offer:

```javascript
// Get a specific offer by ID, or the default one
const offer = product.getOffer('special-offer-id') || product.getOffer();
if (offer) {
    await store.order(offer);
}
```

**Note:** If you previously relied on a single price for one-time products, your code continues to work unchanged. The plugin resolves the first available offer with pricing data when using `product.getOffer()` without an argument.

## Suspended Subscriptions

Previously, Google Play did not return suspended subscriptions (paused or payment on hold) in the purchases list. Starting with Billing Library 8.3, suspended subscriptions are now included, aligning Google Play's behavior with Apple's App Store.

### How it works

- Suspended subscriptions appear in the purchases list with an `expirationDate` in the past
- `product.owned` correctly returns `false` for expired/suspended subscriptions
- No code changes are needed — the existing expiration date check handles this automatically

### What this means for your app

```javascript
store.when().verified(receipt => {
    receipt.collection.forEach(purchase => {
        if (purchase.id === 'premium_sub') {
            if (purchase.expiryDate && purchase.expiryDate < Date.now()) {
                // Subscription is expired or suspended
                lockPremiumContent();
            } else {
                // Subscription is active
                unlockPremiumContent();
            }
        }
    });
    receipt.finish();
});
```

If you already handle expiration dates correctly, suspended subscriptions are handled automatically.

## Pending Purchases

Billing Library 8.3 enables pending purchases for both one-time products and prepaid subscription plans. A pending purchase occurs when the user chooses a delayed payment method (e.g., cash payment at a convenience store in certain markets).

### Handling pending transactions

Pending purchases go through the `INITIATED` state before reaching `APPROVED`:

```javascript
store.when()
    .initiated(transaction => {
        // Payment is pending — inform the user
        showStatus('Your purchase is pending. You will get access once payment completes.');
    })
    .approved(transaction => {
        // Payment completed — proceed with validation
        transaction.verify();
    })
    .verified(receipt => {
        receipt.finish();
    });
```

### Important notes

- Do not grant access to content while a purchase is in the `INITIATED`/pending state
- The purchase transitions to `APPROVED` once the payment is confirmed by Google
- Pending purchases can also be cancelled by the user or expire

## Auto Service Reconnection

The plugin now enables automatic reconnection of the Google Play Billing client. If the connection to Google Play Services drops (e.g., due to a service update or network interruption), the client automatically reconnects without requiring manual intervention.

This is handled internally and requires no code changes.

## Keep Registering Products You've Retired

When you stop selling a subscription, you may deactivate it in Google Play Console. Google Play then no longer returns it when the plugin loads your products, but users who already subscribed keep renewing it.

For those renewals, the plugin needs the product to still be registered: it takes the product type from your `store.register()` call, because Google Play doesn't provide it. So **keep the retired product in your `store.register()` list** for as long as it has active subscribers:

```ts
store.register([
  { id: 'premium_monthly', type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform: CdvPurchase.Platform.GOOGLE_PLAY },
  // Retired in Play Console, still renewing: keep it registered
  { id: 'premium_monthly_2022', type: CdvPurchase.ProductType.PAID_SUBSCRIPTION, platform: CdvPurchase.Platform.GOOGLE_PLAY },
]);
```

Registered, the renewal is validated (`transaction.verify()`) and finished (`transaction.finish()`) like any other, so your validator receives it and the app gets the new expiry date. The product doesn't appear in `store.products` (Google Play didn't return it), so don't rely on it for your catalog UI.

If a product isn't registered, the plugin can't build the validation request. It logs a warning and fires `unverified` with `VERIFICATION_FAILED` and `transient: true`, and keeps doing so until you register it. See [Troubleshooting](../doc/troubleshooting.md). The plugin only does this from the release after v13.20.1; older versions did nothing at all, so the app kept the old expiry date.

## Migration Notes

If you are upgrading from a plugin version prior to v13.13.0:

1. Ensure your `minSdkVersion` is 23 or higher in your `config.xml` or `build.gradle`
2. Test with Google Play's test tracks to verify suspended subscription handling
3. If you use one-time products, test that pricing and offers resolve correctly
4. No API changes are required — the upgrade is backward compatible at the JavaScript level
