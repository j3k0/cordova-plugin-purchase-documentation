---
title: "Writing Your Own Validation Server"
sidebar_position: 5
---

The plugin validates nothing itself. It sends the receipt data to the endpoint in `store.validator` and acts on the JSON answer. [Iaptic](https://www.iaptic.com) implements that contract; this page is the contract, for when you implement it yourself.

`store.validator` takes a URL, or a function:

```javascript
store.validator = 'https://your-server.example/validate'; // received as a JSON POST
// or
store.validator = (body, callback) => {
    myValidate(body).then(callback); // callback takes the answer described below
};
```

## What the plugin sends

A trimmed request body:

```json
{
  "id": "premium_monthly",
  "type": "paid subscription",
  "transaction": {
    "type": "ios-appstore",
    "id": "premium_monthly",
    "appStoreReceipt": "MIIa…base64…"
  },
  "additionalData": {
    "applicationUsername": "user-42",
    "obfuscatedUsername": "e10f0f2a-…"
  },
  "device": { "platform": "ios", "plugin": "cordova-plugin-purchase/13.20.1" }
}
```

*   **`id`** — product identifier; on iOS an application receipt can carry your application id instead.
*   **`type`** — `consumable`, `non consumable`, `paid subscription`, `non renewing subscription` or `application`.
*   **`transaction`** — the store's own data, with a `type` naming the platform: `ios-appstore` (base64 receipt or latest receipt), `apple-sk2` (the JWS transaction), `android-playstore` (purchase token, receipt, signature), `windows-store-transaction`, `braintree`, or `iaptic` (with `adapter: 'stripe'` for web payments). The [Iaptic validation API reference](https://www.iaptic.com/documentation/validation-api) shows each shape with an example.
*   **`additionalData.applicationUsername`** — your user id, when `store.applicationUsername` is set. `obfuscatedUsername` is its obfuscated form, so you can match the ids Apple and Google send in their server notifications.
*   **`products`, `offers`, `priceMicros`, `countryCode`** — product catalogue and pricing, when the plugin knows them.
*   **`device`** — platform and plugin version.

## What your server must answer

A `200` with a JSON body. A success:

```json
{
  "ok": true,
  "data": {
    "id": "premium_monthly",
    "collection": [
      {
        "id": "premium_monthly",
        "purchaseId": "apple:1000000123456789",
        "purchaseDate": "2026-10-19T10:00:00.000Z",
        "expiryDate": "2026-11-19T10:00:00.000Z",
        "isExpired": false,
        "renewalIntent": "Renew"
      }
    ],
    "latest_receipt": true,
    "transaction": { "type": "ios-appstore" }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `ok` | yes | `true` for a success, `false` for an error answer |
| `data.id` | yes | A string that keys this receipt. The plugin keeps one verified receipt per `id` and platform, so **echo the request's `id`**, and give each receipt its own value: two answers with the same `id` replace each other, and on Google Play, where each purchase is its own receipt, that removes the others from `store.verifiedReceipts`. An answer whose `id` isn't a string is rejected as `BAD_RESPONSE` — since v13.20.1 the message names the problem, e.g. `"data.id" must be a string, got undefined` |
| `data.collection` | recommended | The purchases to grant access to: an array of objects with `id` (product id), `purchaseDate`, `expiryDate`, `isExpired`, and optionally `purchaseId`, `renewalIntent`, `isTrialPeriod`, `isBillingRetryPeriod`, `quantity`, … Dates are ISO 8601 strings. Without `collection` a success grants nothing: `store.owned()` stays `false` |
| `data.transaction` | optional | Native transaction detail, exposed as `receipt.nativeTransactions`. Optional since v13.20.1: when absent `nativeTransactions` is `[]` and `receipt.raw.transaction` keeps the original. It was **required** in 13.16.0 to 13.20.0. Iaptic always sends it |
| `data.latest_receipt` | optional | `true` when you validated the latest receipt you have for that subscription |
| `data.warning` | optional | A message for the app, for example when you had to fall back to a backup validation |
| `data.date` | optional | Your server's time, used as a more reliable clock than the device's |
| `data.cache` | optional | Set it **only** when you answer with a previously validated receipt because the store couldn't be reached: `{ "source": "last-verified", "reason": "store_unreachable", "lastConfirmedAt": "…" }`. Apps use it to tell a cached answer from a store-confirmed one |

An error answer:

```json
{ "ok": false, "status": 400, "code": 6778001, "message": "Invalid receipt" }
```

`code` and `message` are what the app sees in its `unverified` payload; use `CdvPurchase.ErrorCode` values where they fit. `VALIDATOR_SUBSCRIPTION_EXPIRED` (6778003) is deprecated: return the purchase in `collection` with `isExpired: true` instead.

## What the plugin does with the answer

*   `ok: true` → `verified` fires with a `VerifiedReceipt`, built from `collection`.
*   `ok: false` → `unverified` fires. `transient` says whether the answer is a temporary failure or a verdict on the receipt — see [Paying users locked out during an outage](../doc/troubleshooting.md#receipt-validation-issues).
*   **Retries.** The plugin retries what it considers temporary (4 attempts in total, after 5 s, 10 s and 20 s, and right away when the device comes back online): HTTP 5xx, timeouts, no network, an `ok: false` body with `status >= 500` or `code: 6778002` (store unreachable), and an answer it can't parse (`BAD_RESPONSE`, also retried). Your endpoint must be safe to call several times for the same receipt. Anything else is a verdict and is not retried.

## See also

*   [Why receipt validation matters](receipt-validation-importance.md) — what you gain by validating server-side.
*   [Troubleshooting: receipt validation issues](../doc/troubleshooting.md#receipt-validation-issues) — the codes and the `transient` flag.
*   [Iaptic validation API](https://www.iaptic.com/documentation/validation-api) — per-platform request and response examples.
