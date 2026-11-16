---
title: "Offer Code Redemption"
sidebar_position: 19
---


Offer codes are single-use codes you hand out outside the App Store: campaigns, promotions, a support gesture. The user types or taps the code in a system sheet, and Apple turns it into a regular transaction for the product it unlocks.

The plugin opens that sheet from JavaScript with `store.redeemCode()`.

Offer codes work with every Apple product type: auto-renewable subscriptions (iOS 14.2+, macOS 15.0+), consumables, non-consumables and non-renewing subscriptions (iOS 16.3+, macOS 15.0+).

## Availability

Offer codes predate the result-based sheet, so two things have separate floors: the sheet itself, and whether the plugin can tell you how it ended.

| What | Where |
|---|---|
| Result-based sheet: transaction, cancel, error | iOS / iPadOS / macCatalyst / visionOS 27+, macOS 27+ |
| Fire-and-forget sheet: opens, reports nothing | every version that has a sheet at all |
| Platform with no sheet | Google Play, Braintree, iaptic-js, test platform |

The native call the plugin wraps on 27+ is `AppStore.presentOfferCodeRedeemSheet(from:options:)`, verified in the Xcode 27.2 SDK headers (iOS 27.0+, macOS 27.0+, unavailable on tvOS and watchOS). Below 27 it falls back to the sheets Apple deprecated in 27.0 — `presentOfferCodeRedeemSheet(in: UIWindowScene)` on iOS 16+ through the StoreKit 2 extension, `presentOfferCodeRedeemSheet(from: NSViewController)` on macOS 15+, or `SKPaymentQueue.presentCodeRedemptionSheet()` (iOS 14+, deprecated since iOS 18) on the StoreKit 1 bridge. Which one runs depends on the installed bridge, not on your code.

Check the feature before offering the entry point in your UI:

```javascript
const { store, Platform } = CdvPurchase;

if (store.checkSupport(Platform.APPLE_APPSTORE, 'redeemCode')) {
    showRedeemButton();
}
```

`checkSupport('redeemCode')` answers one question: **can the sheet be opened here?** It is `true` on iOS 16–26 and on the StoreKit 1 bridge as well — where the sheet opens but reports nothing. It does *not* mean outcomes are reported; only iOS 27+ tells you why a redemption produced no transaction. See [Before iOS 27](#before-ios-27).

## Redeeming a code

```javascript
const { store } = CdvPurchase;

const error = await store.redeemCode();
if (error) {
    // The sheet produced no transaction: show a message, log the code if you want.
    console.log(`Redemption failed: ${error.code} ${error.message}`);
}
```

```typescript
store.redeemCode(options?: string[]): Promise<IError | undefined>
```

`store.redeemCode()` resolves to `undefined` once the sheet has been handled, or to an `IError` when no transaction came out of it. A returned error is also dispatched to the store's error handler, exactly as for `order()`.

### The `options` argument

`store.redeemCode(options?)` accepts Apple's `RedeemOption` set, which the redemption sheet uses to configure itself. **It is reserved for now:** WWDC26 introduced the parameter, but the Xcode 27.2 SDK declares `RedeemOption` as a struct with no public values and no public initializer, so no app can pass anything yet. Call `store.redeemCode()` with no argument; a value supplied today is ignored.

### Where the transaction arrives

**The redeemed transaction does not come back from this call.** It arrives through the `approved` event, exactly like a purchase, so the handler you already have for purchases handles redemptions too:

```javascript
store.when().approved(transaction => {
    // Fires for a redemption just like for an order:
    // grant access, validate, then finish.
    transaction.finish();
});
```

Nothing new is needed on your side to ingest a redeemed transaction: `receiptUpdated` / `verified` / `finished` fire as usual. It may arrive after the call has resolved — StoreKit re-emits transactions through `Transaction.updates`, and a transaction Apple could not hand over immediately reaches your app on the next launch. Treat the events, never the `redeemCode()` return value, as the source of truth for what was redeemed.

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
| System error, unknown error, unverified transaction | `ErrorCode.UNKNOWN` (6777010) | Also Apple's `invalidPresentationContext`, which means the sheet could not be presented at all (bad window / view controller) — a bug in your app, not a user outcome |

`IError.message` carries Apple's own case name (for example `notAvailableInStorefront`), which is useful for logs and support requests. Apple errors the plugin does not recognise, and the case where there is no view controller to present the sheet from, also land on `UNKNOWN`.

## Before iOS 27

Below iOS 27 the plugin shows an older, deprecated redemption sheet, which returns nothing:

- the sheet closes and that is all you learn — **no cancel event, no error**;
- a successful redemption still reaches your app, through the usual transaction / purchase events, exactly as on iOS 27+.

So below iOS 27 `redeemCode()` resolves `undefined` whether the user redeemed a code or closed the sheet, and there is no way to tell the two apart. Don't try to work it out by comparing entitlements before and after the call: a successful transaction can be delivered after the call has returned — StoreKit re-emits it through `Transaction.updates`, and if your app is busy at redemption time it can arrive on the next launch. Handle `approved` / `receiptUpdated` as you do for purchases; that is the signal that matters.

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

- [Supporting offer codes in your app](https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app) — Apple's guide: offer code types (one-time use, custom, and sandbox codes for testing), the redemption APIs, the `offerType` value that identifies a redemption, and the testing steps below.
- [What's new in Apple In-App Purchase](https://developer.apple.com/videos/play/wwdc2026/210/) — WWDC26 session 210. Its "Offer code redemption" chapter (9:26) is the announcement of the result-based API: *"The offer code redemption API is extended to take in a set of RedeemOption values and returns a VerificationResult."*

## Testing redemptions

Apple documents two routes, and both work with the plugin:

- **Sandbox.** Create sandbox offer codes in App Store Connect (up to 10,000 per quarter, separate from the customer codes), sign the device into a Sandbox Apple Account, then redeem from the sheet your app opens. The sandbox does not enforce a redemption limit per account and ignores eligibility for consumables, non-consumables and non-renewing subscriptions; it does apply eligibility for auto-renewable subscriptions, so clear the account's purchase history to test a subscription code twice.
- **Xcode.** StoreKit Testing supports offer codes: configure one on the product in the StoreKit configuration editor, then redeem it against your local build. No account, no App Store Connect round-trip.

Test on both sides of the iOS 27 boundary if you support older versions — that is where the missing outcome bites.
