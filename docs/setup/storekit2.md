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

The extension loads `Transaction.currentEntitlements` at startup, so existing subscriptions are visible immediately without requiring a manual restore. See the behavior change below for the full set of events this produces.

### Behavior change: purchase events at app launch (Capacitor iOS)

StoreKit 1 only re-delivered *unfinished* transactions at launch. StoreKit 2 surfaces the user's full set of **current entitlements**, so `store.initialize()` fires `approved` for:

*   every non-consumable purchase,
*   the latest transaction of each auto-renewable subscription,
*   each non-renewing subscription -- including transactions you already finished.

`store.restorePurchases()` fires `approved` for that same set.

Consumables are **not** re-delivered this way: they never appear in StoreKit 2's current entitlements. Only an *unfinished* consumable is re-delivered, once per launch, exactly as under StoreKit 1.

**What this means for your app.** With the usual pattern:

```javascript
store.when().approved(transaction => {
    deliverToServer(transaction); // your fulfillment endpoint
    transaction.finish();
});
```

`approved` fires for already-fulfilled non-consumables and non-renewing subscriptions on every app launch. Make fulfillment **idempotent on the transaction id**: your server (or app) must treat a re-delivered, already-fulfilled transaction id as a no-op, otherwise the user is granted the same purchase again on each launch. The same applies to an unfinished consumable re-delivered at launch.

Register your `approved` handler before calling `store.initialize()` -- the launch-time events are emitted during and shortly after initialization, and are lost if nothing is listening yet.

This behavior is shared by the Cordova StoreKit 2 extension and the Capacitor plugin's built-in StoreKit 2 bridge.

**Version note:** current entitlements are surfaced at launch by the StoreKit 2 extension since v1.0.1 and by `capacitor-plugin-cdv-purchase` since v13.15.2. The `Transaction.unfinished` pass that re-emits unfinished consumables, and the deferral of the `Transaction.updates` observer to the end of `init()` ([#1714](https://github.com/j3k0/cordova-plugin-purchase/issues/1714), commit `fa38a27`), are on `master` but not in a published release yet.

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
