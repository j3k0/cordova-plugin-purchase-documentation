---
title: "StoreKit 2 Extension"
sidebar_position: 6
---


Starting with v13.14.0, the plugin supports Apple's StoreKit 2 API as an optional extension. When installed, the Apple AppStore adapter automatically upgrades from StoreKit 1 to StoreKit 2 on iOS 15+ devices — no code changes are needed in your application.

## Installation

Install the extension plugin alongside the main purchase plugin:

```sh
cordova plugin add cordova-plugin-purchase-storekit2
```

**Requirements:**
- cordova-ios 7+ (tested with cordova-ios 8)
- iOS 15+ at runtime (falls back to StoreKit 1 on older versions)

For Capacitor projects:

```sh
npm install cordova-plugin-purchase-storekit2
npx cap sync
```

## What Changes with StoreKit 2

Once the extension is installed, the following behaviors change automatically on iOS 15+:

| Feature | StoreKit 1 | StoreKit 2 |
|---------|-----------|-----------|
| Receipt format | Monolithic `appStoreReceipt` blob | Per-transaction JWS (JSON Web Signature) tokens |
| Validation request type | `apple-appstore` with receipt data | `apple-sk2` with `jwsRepresentation` field |
| Native API | Objective-C callback-based | Swift async/await |
| Transaction observation | `SKPaymentQueue` observer | `Transaction.updates` stream |
| Subscription management | Custom implementation | Built-in system sheets |
| Offer code redemption | Not available | Native redemption sheet |

## Architecture

The StoreKit 2 support is split between two packages:

1. **Main plugin** (`cordova-plugin-purchase`) — contains the TypeScript bridge, adapter logic, and runtime SK2 detection.
2. **Extension plugin** (`cordova-plugin-purchase-storekit2`) — contains only the native Swift code and a JS marker file for detection.

At startup, the Apple AppStore adapter checks whether the extension is present. If detected and the device runs iOS 15+, all native calls route through the SK2 bridge. Otherwise, the plugin falls back to StoreKit 1 transparently.

## Application Code

No changes are required in your application JavaScript. The same API calls work regardless of which StoreKit version is active:

```javascript
const { store, ProductType, Platform } = CdvPurchase;

store.register([{
    id: 'premium_subscription',
    type: ProductType.PAID_SUBSCRIPTION,
    platform: Platform.APPLE_APPSTORE
}]);

store.when()
    .approved(transaction => transaction.verify())
    .verified(receipt => receipt.finish())
    .finished(transaction => unlockContent());

await store.initialize([Platform.APPLE_APPSTORE]);
```

## Server-Side Validation

If you use server-side receipt validation (iaptic or a custom endpoint), note that the transaction format changes with SK2:

- **StoreKit 1:** Sends the full App Store receipt (`appStoreReceipt` base64 blob)
- **StoreKit 2:** Sends individual JWS tokens per transaction

If you use [iaptic](https://www.iaptic.com) as your validation service, both formats are handled automatically. If you use a custom validator, ensure it handles the `apple-sk2` transaction type alongside the traditional `apple-appstore` type.

## Behavior Details

### Existing subscriptions at launch

The extension loads `Transaction.currentEntitlements` at startup, so existing subscriptions are visible immediately without requiring a manual restore.

### SK1 standdown

When both plugins are installed on iOS 15+, the StoreKit 1 `SKPaymentQueue` observer is not registered. This eliminates duplicate transaction delivery and conflicting auto-finish behavior.

### Transaction deduplication

When SK2 delivers the same subscription via both `product.purchase()` and `Transaction.updates` (different `transactionId`, same `originalTransactionId` + `purchaseDate`), duplicates are finished at the native level automatically.

### Mac Catalyst

`store.getStorefront()` works on Mac Catalyst (including Capacitor's "Designed for iPad" mode) via the SK2 bridge's `Storefront.current`.

## Troubleshooting

**Extension not detected:** Ensure `cordova-plugin-purchase-storekit2` is installed and appears in your project's plugin list. Run `cordova plugin list` to verify.

**Still using SK1 on iOS 15+:** Check device logs for `CdvPurchase.AppleAppStore.swift` — if absent, the extension is not loaded. Reinstall the plugin.

**Duplicate transactions:** If you see doubled validation calls, ensure you are on plugin v13.15.2+ which includes deduplication fixes.
