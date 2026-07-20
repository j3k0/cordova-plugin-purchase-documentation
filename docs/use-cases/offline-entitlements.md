---
title: "Offline Entitlements"
sidebar_position: 18
---

Starting with v13.18.0, the plugin ships `CdvPurchase.OfflineEntitlements`, a helper class that answers "is this product owned?" when the device is offline or has just restarted without connectivity.

It persists a subset of each `VerifiedPurchase` to device storage on every `verified` event, reloads it at app launch, and exposes `isOwned()` against that persisted cache. `store.owned()` itself is unchanged — it still checks the in-memory verified and local receipts. `OfflineEntitlements` adds a **parallel** check, so you can combine both:

```javascript
const offline = new CdvPurchase.OfflineEntitlements(store, {
    gracePeriodMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    onExpiredOffline: 'readonly',
    detectClockRollback: true,
});

await offline.ready();

function isUserPremium() {
    return store.owned('premium') || offline.isOwned('premium');
}
```

## Security Boundary: Phase 1 Is an Unsigned Cache

**Phase 1 persists entitlement data with no signature, no JWT, and no cryptography.** The cache is a convenience for UI gating while offline, not proof of purchase. A user with access to the device's storage can tamper with it. Do not use `OfflineEntitlements` as the sole gate for high-value content or server-side entitlements — always confirm with receipt validation (`store.owned()` / your validator) once connectivity is back.

## Retrieving Entitlement Details

Use `find()` to retrieve the persisted entitlement for a product — expiry date, renewal intent, last renewal date, etc. — without digging into local storage by hand:

```javascript
const entitlement = offline.find('premium');
if (entitlement?.expiryDate) {
    const daysLeft = Math.ceil((entitlement.expiryDate - Date.now()) / 86400000);
    showRenewalBanner(daysLeft);
}
```

## Options

| Option | Description |
|---|---|
| `storage` | Pluggable `OfflineStorageAdapter` (defaults to a `localStorage` wrapper). For long-offline deployments (weeks without connectivity), pass a file-based or secure-storage adapter — `localStorage` can be evicted by the WebView under storage pressure. |
| `gracePeriodMs` | Grace window after a subscription's `expiryDate` during which it is still considered owned (default 30 days). |
| `onExpiredOffline` | Behavior when the grace period has elapsed and the device is still offline: `'readonly'` keeps granting access (default), `'deny'` revokes it. |
| `detectClockRollback` | If `true`, deny access when the persisted `lastSeenTimestamp` is in the future relative to `now` (clock tampering). |

## Events

Subscribe with `offline.on(event => ...)` to be notified of state transitions:

| Event | When It Fires |
|---|---|
| `grace` | A subscription is past `expiryDate` but still within the grace period |
| `readonly` | Grace period elapsed while offline, access kept (`onExpiredOffline: 'readonly'`) |
| `clock_rollback` | Clock tampering detected (persisted timestamp in the future) |
| `entitlement_missing` | No persisted entitlement for a queried product |
| `expired` | An entitlement expired and access was revoked |

Events are deduplicated per `productId`.

## Clearing Persisted Data

`offline.clear()` removes all persisted entitlements — call it on user logout.

## Platform Compatibility

`OfflineEntitlements` is a TypeScript-only helper with no native code. The StoreKit 2, Braintree, and Apple Pay companion plugins are unaffected and require no version bump.
