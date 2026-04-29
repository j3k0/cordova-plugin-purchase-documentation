---
title: "Google Play Billing 8.3 Features"
sidebar_position: 14
---


Plugin v13.13.0 upgraded to Google Play Billing Library 8.3.0. This brings several new behaviors and capabilities for Android in-app purchases.

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

## Migration Notes

If you are upgrading from a plugin version prior to v13.13.0:

1. Ensure your `minSdkVersion` is 23 or higher in your `config.xml` or `build.gradle`
2. Test with Google Play's test tracks to verify suspended subscription handling
3. If you use one-time products, test that pricing and offers resolve correctly
4. No API changes are required — the upgrade is backward compatible at the JavaScript level
