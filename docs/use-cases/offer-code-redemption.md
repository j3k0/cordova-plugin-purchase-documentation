---
title: "Offer Code Redemption"
sidebar_position: 19
---


Offer codes are single-use codes you hand out outside the App Store: campaigns, promotions, a support gesture. The user types or taps the code in a system sheet, and Apple turns it into a regular transaction for the product it unlocks.

The plugin opens that sheet from JavaScript with `store.redeemCode()`.

Offer codes work with every Apple product type: consumables, non-consumables, auto-renewable subscriptions and non-renewing subscriptions.

## Availability

| Platform | Sheet | Cancel and error reporting |
|---|---|---|
| iOS / iPadOS / macCatalyst / visionOS | 27+ result-based sheet · 16–26 deprecated fire-and-forget sheet | 27+ only |
| macOS | 27+ result-based sheet · 15–26 deprecated fire-and-forget sheet | 27+ only |
| Google Play, Braintree, iaptic-js, test platform | Not supported | — |

Check the feature before offering the entry point in your UI:

```javascript
const { store, Platform } = CdvPurchase;

if (store.checkSupport(Platform.APPLE_APPSTORE, 'redeemCode')) {
    showRedeemButton();
}
```

`checkSupport('redeemCode')` is `true` wherever the sheet can be opened, which includes iOS 16–26 and devices routed through the StoreKit 1 bridge. Those older versions only fail silently — see [Before iOS 27](#before-ios-27).

## Redeeming a code

```javascript
const { store } = CdvPurchase;

const error = await store.redeemCode();
if (error) {
    // The sheet produced no transaction: show a message, log the code if you want.
    console.log(`Redemption failed: ${error.code} ${error.message}`);
}
```

`store.redeemCode()` resolves to `undefined` once the sheet has been handled, or to an `IError` when no transaction came out of it.

**The redeemed transaction does not come back from this call.** It arrives through the `approved` event, exactly like a purchase, so the handler you already have for purchases handles redemptions too:

```javascript
store.when().approved(transaction => {
    // Fires for a redemption just like for an order:
    // grant access, validate, then finish.
    transaction.finish();
});
```

Nothing new is needed on your side to ingest a redeemed transaction: `receiptUpdated` / `verified` / `finished` fire as usual.

## Outcomes on iOS 27+

The result-based sheet can end three ways:

| Outcome | `redeemCode()` resolves to | Your `approved` handler |
|---|---|---|
| Code accepted, transaction produced | `undefined` | fires with the transaction |
| Sheet dismissed by the user | `IError` with `ErrorCode.PAYMENT_CANCELLED` | does not fire |
| Redemption failed | `IError` with one of the codes below | does not fire |

## Error codes

Redemption reuses the plugin's existing error codes — no new codes were introduced, so an error handler you wrote for `store.order()` keeps working.

| Failure | `IError.code` | Notes |
|---|---|---|
| User cancelled | `ErrorCode.PAYMENT_CANCELLED` (6777006) | |
| Network failure | `ErrorCode.COMMUNICATION` (6777014) | |
| Account not entitled, code not available in the storefront, feature unsupported | `ErrorCode.PAYMENT_NOT_ALLOWED` (6777008) | |
| System error, unknown error, unverified transaction | `ErrorCode.UNKNOWN` (6777010) | Includes Apple's `invalidPresentationContext` |

`IError.message` carries Apple's own case name (for example `notAvailableInStorefront`), which is useful for logs and support requests.

<!-- TODO(FOV-2765): confirm with CDVGD that invalidPresentationContext really lands on UNKNOWN, and whether it is surfaced at all. -->

## Before iOS 27

On iOS 16–26 (and macOS 15–26) the plugin shows the older, deprecated redemption sheet, which returns nothing:

- the sheet closes and that is all you learn — **no cancel event, no error**;
- a successful redemption still reaches your app, through the usual transaction / purchase events, exactly as on iOS 27+.

So on iOS 16–26 `redeemCode()` resolves `undefined` whether the user redeemed a code or closed the sheet. If you need to tell the two apart, compare the receipts or entitlements before and after the call.

This is a documented limitation of the platform APIs, not a gap in the plugin, and it will not be back-filled.

## Migrating from `presentCodeRedemptionSheet()`

The StoreKit 1 redemption sheet is still reachable, but it is deprecated:

```javascript
// Deprecated — returns nothing, whatever the outcome.
await store.getAdapter(CdvPurchase.Platform.APPLE_APPSTORE)
    .presentCodeRedemptionSheet();

// Replacement — same sheet, plus the outcome on iOS 27+.
await store.redeemCode();
```

`Adapter.presentCodeRedemptionSheet()` stays for compatibility and now runs over the same path as `redeemCode()`, ignoring the result. Move to `store.redeemCode()` when you next touch the code.

## Nothing else in the stack changes

Redemption is a client-side flow. The transaction Apple produces is an ordinary purchase, and the rest of the stack already handles it:

- **Receipt validation** — same `verified` / `receiptUpdated` flow, no new field.
- **StoreKit 2 extension** (`cordova-plugin-purchase-storekit2`) — no change needed, it validates the redemption's `jwsRepresentation` like any other transaction. See [StoreKit 2 Extension](../setup/storekit2.md).
- **Server side** — no change. An iaptic-validated redemption is an ordinary `apple-sk2` JWS sent to `/v1/validate`; the offer-code reference lands in `discountId`, and `offerType` is `3`.
- **Transaction finishing** — same owner as for purchases: your app calls `transaction.finish()`, the plugin never finishes on its own.

## Where codes come from

Codes are created and distributed from App Store Connect, not from your app:

- [Supporting offer codes in your app](https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app) — Apple's guide to creating offer codes and the redemption sheet.
- [What's new in Apple In-App Purchase (WWDC26 session 210)](https://developer.apple.com/videos/play/wwdc2026/210/) — the session that introduced the result-based redemption sheet this page documents.

## Testing redemptions

Redemption sheets work in the App Store sandbox: create a sandbox offer code in App Store Connect, install a development or TestFlight build signed into a sandbox Apple Account, and redeem. Test on both sides of the iOS 27 boundary if you support iOS 16–26 — that is where the missing outcome bites.
