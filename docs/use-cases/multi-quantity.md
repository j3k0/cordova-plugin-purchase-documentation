---
title: "Multi-Quantity Consumable Purchases"
sidebar_position: 12
---


Starting with v13.15.0, the plugin supports ordering multiple units of a consumable product in a single transaction on both iOS and Android. Previously this was Android-only.

## Ordering with Quantity

Pass a `quantity` value in the additional data when calling `store.order()`:

```javascript
const product = store.get('my_consumable');
const offer = product && product.getOffer();

if (offer) {
    const error = await store.order(offer, { quantity: 3 });
    if (error) {
        console.log('Order failed: ' + error.message);
    }
}
```

**iOS limit:** Apple restricts quantity to 1-10 per transaction.

**Android:** Google Play has supported multi-quantity consumables since the plugin first introduced it. No specific upper limit is enforced by the plugin, but Google Play may apply its own limits.

## Checking Platform Support

Not all platforms support multi-quantity orders. Use `checkSupport` to decide whether to show a quantity picker in your UI:

```javascript
const { store, Platform } = CdvPurchase;

if (store.checkSupport(Platform.APPLE_APPSTORE, 'orderQuantity')) {
    // Show quantity picker for iOS
    showQuantityPicker();
} else if (store.checkSupport(Platform.GOOGLE_PLAY, 'orderQuantity')) {
    // Show quantity picker for Android
    showQuantityPicker();
} else {
    // Platform does not support multi-quantity; order one at a time
}
```

The `'orderQuantity'` capability is advertised by the Apple AppStore adapter. The Google Play adapter supports it through the standard `order` flow.

## Reading Quantity from Verified Purchases

After receipt validation, the server-side response includes the quantity in the `VerifiedPurchase` object:

```javascript
store.when().verified(receipt => {
    receipt.collection.forEach(purchase => {
        if (purchase.id === 'my_consumable' && purchase.quantity) {
            grantCoins(purchase.quantity * COINS_PER_UNIT);
        }
    });
    receipt.finish();
});
```

The `VerifiedPurchase.quantity` field:

```typescript
interface VerifiedPurchase {
    id: string;
    // ... other fields ...
    /**
     * Quantity of items purchased in a single transaction.
     * For consumable products, represents the number of items purchased.
     * For non-consumable products and subscriptions, always 1.
     */
    quantity?: number;
}
```

## Complete Example

```javascript
const { store, ProductType, Platform } = CdvPurchase;

// Register a consumable product
store.register([{
    id: 'coins_pack',
    type: ProductType.CONSUMABLE,
    platform: Platform.APPLE_APPSTORE
}]);

// Handle verified purchases
store.when().verified(receipt => {
    receipt.collection.forEach(purchase => {
        if (purchase.id === 'coins_pack') {
            const qty = purchase.quantity || 1;
            addCoins(qty * 100); // 100 coins per unit
        }
    });
    receipt.finish();
});

// Order with quantity (after user selects amount)
async function buyCoins(quantity) {
    const product = store.get('coins_pack');
    const offer = product && product.getOffer();
    if (!offer) return;

    const error = await store.order(offer, { quantity: quantity });
    if (error) {
        showError('Purchase failed: ' + error.message);
    }
}
```

## Notes

- If `quantity` is not specified, it defaults to 1.
- The quantity is part of `AdditionalData`, not tied to a specific platform's additional data object — it works cross-platform.
- Always validate the actual quantity received from the server (via `VerifiedPurchase.quantity`) rather than trusting the client-side value.
