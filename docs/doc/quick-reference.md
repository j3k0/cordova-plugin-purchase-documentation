---
title: "Quick Reference"
sidebar_position: 2
---


This page provides a concise overview of the most-used types and methods in the `cordova-plugin-purchase` v13+ API. For full details, see the [auto-generated API documentation](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api).

## Core Entry Point

```javascript
const { store, ProductType, Platform, LogLevel } = CdvPurchase;
```

| Property / Method | Description |
|---|---|
| `store.verbosity` | Set log level (`LogLevel.DEBUG`, `INFO`, `WARNING`, `ERROR`, `QUIET`) |
| `store.register([...])` | Register products before initialization |
| `store.initialize([...platforms])` | Initialize platform adapters and load products |
| `store.update()` | Refresh product prices and purchase status |
| `store.restorePurchases()` | Trigger platform restore (iOS non-consumables, subscriptions) |
| `store.when()` | Register event listeners (returns chainable builder) |
| `store.get(id, platform)` | Get a registered `Product` by id and platform |
| `store.owned(product)` | Check if a product is owned (based on validated receipts) |
| `store.order(offer, additionalData?)` | Initiate a purchase for an offer |
| `store.getStorefront()` | Get the user's billing country (`{ countryCode }`) |
| `store.checkSupport(platform, feature)` | Check if a platform supports a feature |
| `store.products` | Array of all loaded `Product` objects |
| `store.localReceipts` | Array of local `Receipt` objects |
| `store.verifiedReceipts` | Array of `VerifiedReceipt` objects |
| `store.verifiedPurchases` | Flattened array of all `VerifiedPurchase` objects |
| `store.validator` | URL string or function for receipt validation |
| `store.validator_privacy_policy` | Array of privacy categories sent to validator |
| `store.applicationUsername` | App-specific user identifier sent with purchases |
| `store.obfuscator` | `Obfuscator` | How `applicationUsername` is transformed before being sent to the native store (`'uuid'` recommended, `'legacy'` default) |

## Events (via `store.when()`)

```javascript
store.when()
  .approved(transaction => { /* ... */ })
  .verified(receipt => { /* ... */ })
  .finished(transaction => { /* ... */ })
  .productUpdated(product => { /* ... */ })
  .receiptUpdated(receipt => { /* ... */ })
  .storefrontUpdated(storefront => { /* ... */ })
  .unverified(payload => { /* ... */ });
```

| Event | Callback Argument | When It Fires |
|---|---|---|
| `approved` | `Transaction` | A purchase has been approved by the store |
| `verified` | `VerifiedReceipt` | Receipt validation succeeded |
| `finished` | `Transaction` | A transaction has been acknowledged/consumed |
| `productUpdated` | `Product` | Product metadata (price, title) changed |
| `receiptUpdated` | `Receipt` | Local receipt/transaction state changed |
| `storefrontUpdated` | `Storefront` | User's billing country changed |
| `unverified` | `UnverifiedReceipt` | Receipt validation failed |

## Key Types

### Product

Represents store metadata for a registered product.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Product identifier |
| `platform` | `Platform` | Which store this product belongs to |
| `type` | `ProductType` | `CONSUMABLE`, `NON_CONSUMABLE`, `PAID_SUBSCRIPTION`, `NON_RENEWING_SUBSCRIPTION` |
| `title` | `string` | Localized title |
| `description` | `string` | Localized description |
| `offers` | `Offer[]` | Pricing options for this product |
| `pricing` | `PricingPhase` | Shortcut to the first pricing phase of the first offer |

### Offer

A specific pricing option for a product.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Offer identifier |
| `pricingPhases` | `PricingPhase[]` | Phases (trial, intro, regular) |
| `canPurchase` | `boolean` | Whether this offer can currently be purchased (`false` while a transaction is pending or unfinished) |
| `order(additionalData?)` | method | Initiate purchase of this offer |

### PricingPhase

Details about a pricing period.

| Field | Type | Description |
|---|---|---|
| `price` | `string` | Formatted price string (e.g., "$4.99") |
| `priceMicros` | `number` | Price in micros (e.g., 4990000) |
| `currency` | `string` | ISO currency code |
| `billingPeriod` | `string` | ISO 8601 duration (e.g., "P1M" for monthly) |
| `paymentMode` | `PaymentMode` | `PayAsYouGo`, `UpFront`, `FreeTrial` |
| `recurrenceMode` | `RecurrenceMode` | `FINITE_RECURRING`, `INFINITE_RECURRING`, `NON_RECURRING` |

### Transaction

Represents a purchase attempt from the device SDK.

| Field | Type | Description |
|---|---|---|
| `transactionId` | `string` | Unique transaction identifier |
| `state` | `TransactionState` | `INITIATED`, `PENDING`, `APPROVED`, `FINISHED` |
| `products` | `{ id, offerId? }[]` | Products in this transaction |
| `platform` | `Platform` | Originating platform |
| `purchaseDate` | `Date` | When the purchase was made |
| `verify()` | method | Send this transaction for receipt validation |
| `finish()` | method | Acknowledge/consume this transaction |

### VerifiedReceipt

Result from receipt validation (the trusted source for entitlement).

| Field | Type | Description |
|---|---|---|
| `collection` | `VerifiedPurchase[]` | Validated purchases in this receipt |
| `finish()` | method | Finish all transactions in this receipt |

### VerifiedPurchase

Authoritative purchase data from your validator.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Product identifier |
| `purchaseDate` | `Date` | Original purchase date |
| `expiryDate` | `Date` | Subscription expiry (if applicable) |
| `isExpired` | `boolean` | Whether the subscription has expired |
| `renewalIntent` | `string` | Whether the user intends to renew |
| `quantity` | `number` | Number of units (consumables, v13.15+) |
| `introPriceEligible` | `boolean?` | Whether the user is eligible for an introductory price (Apple SK2 only, v13.15.4+) |

### Obfuscator

Controls how `applicationUsername` is transformed before being sent to the native store.

| Value | Behavior |
|---|---|
| `'uuid'` | **Recommended.** Deterministic UUIDv3 on all platforms. Valid as Apple's `appAccountToken` and Google Play's `obfuscatedAccountId`. |
| `'legacy'` | Default (backward compat). MD5 hash on Google Play; UUIDv3 on Apple SK2; raw value on Apple SK1. |
| `'disabled'` | No transformation — raw `applicationUsername` is passed through. For Apple SK2 the value must be a valid UUID. |
| Custom function | `(username: string, platform: Platform) => string` — full control. Must return a valid UUID for Apple platforms. |

```javascript
store.applicationUsername = 'user-42';
store.obfuscator = 'uuid'; // deterministic UUID — valid for Apple appAccountToken and Google obfuscatedAccountId
```

### Error Codes

Common error codes (full list in `CdvPurchase.ErrorCode`):

| Code | Meaning |
|---|---|
| `ErrorCode.SETUP` | Store not set up |
| `ErrorCode.PURCHASE` | Generic purchase error |
| `ErrorCode.STORE_BLOCKED` | Store is blocked by OEM restrictions (e.g. Google Play unavailable on device, v13.16.1+) |
| `ErrorCode.COMMUNICATION` | Network/communication error |
| `ErrorCode.VERIFICATION_FAILED` | Receipt verification failed |
| `ErrorCode.BAD_RESPONSE` | Invalid validator response |

## Platforms

| Enum Value | Description |
|---|---|
| `Platform.APPLE_APPSTORE` | Apple App Store (iOS, macOS) |
| `Platform.GOOGLE_PLAY` | Google Play Store (Android) |
| `Platform.BRAINTREE` | Braintree payments |
| `Platform.IAPTIC_JS` | Iaptic/Stripe web payments |
| `Platform.TEST` | Built-in test platform |

## Typical Flow

```javascript
const { store, ProductType, Platform } = CdvPurchase;

// 1. Configure
store.verbosity = CdvPurchase.LogLevel.DEBUG;
store.validator = "https://validator.iaptic.com/v1/validate?appName=...";
store.applicationUsername = 'user-42';
store.obfuscator = 'uuid'; // deterministic UUID — valid for Apple appAccountToken

// 2. Register products
store.register([{
  id: 'premium_monthly',
  type: ProductType.PAID_SUBSCRIPTION,
  platform: Platform.APPLE_APPSTORE
}]);

// 3. Set up event listeners
store.when()
  .approved(transaction => transaction.verify())
  .verified(receipt => {
    // Grant entitlement based on receipt.collection
    receipt.finish();
  });

// 4. Initialize
await store.initialize([Platform.APPLE_APPSTORE]);

// 5. Purchase (triggered by user action)
const product = store.get('premium_monthly', Platform.APPLE_APPSTORE);
const offer = product?.getOffer();
if (offer) {
  const error = await offer.order();
  if (error) console.error('Purchase failed:', error.message);
}
```
