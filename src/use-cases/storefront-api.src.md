# Storefront API

The Storefront API lets you retrieve the user's billing country from the active payment platform. This is useful for regional pricing, locale-specific product filtering, or legal compliance (e.g. showing privacy prompts required in certain jurisdictions).

**Availability:** v13.15.0+ — Apple AppStore (SK1 + SK2), Google Play, Capacitor native plugin.

## Retrieving the Storefront

Call `store.getStorefront()` to get the cached billing country:

```javascript
const storefront = store.getStorefront();
if (storefront && storefront.countryCode) {
    console.log('Billing country: ' + storefront.countryCode);
    // e.g. { platform: 'ios-appstore', countryCode: 'US' }
}
```

The returned object has this shape:

```typescript
interface Storefront {
    /** The platform this storefront belongs to. */
    readonly platform: Platform;
    /** ISO 3166-1 alpha-2 country code (e.g., "US", "FR"). */
    readonly countryCode: string | undefined;
}
```

**Platform-specific call:** You can pass a platform to get the storefront for a specific adapter:

```javascript
const appleStorefront = store.getStorefront(CdvPurchase.Platform.APPLE_APPSTORE);
const googleStorefront = store.getStorefront(CdvPurchase.Platform.GOOGLE_PLAY);
```

Without a platform argument, it returns the first cached non-empty storefront.

## Listening for Storefront Changes

The `storefrontUpdated` event fires when the billing country changes (e.g. the user switches regions):

```javascript
store.when().storefrontUpdated(storefront => {
    console.log('Storefront changed: ' + storefront.countryCode);
    // Update UI or product filtering
});
```

The event only fires on actual value changes, not on every refresh. The cache preserves the last known value even if a refresh fails.

## Checking Platform Support

Before relying on the storefront, verify the platform supports it:

```javascript
if (store.checkSupport(CdvPurchase.Platform.APPLE_APPSTORE, 'getStorefront')) {
    // Storefront API is available
}
```

Supported platforms: Apple AppStore, Google Play.

## Refresh Behavior

The storefront value is automatically refreshed after these store operations:

- `store.initialize()`
- `store.order()` (after a purchase completes)
- `store.restorePurchases()`
- `store.update()`

You do not need to manually trigger refreshes in normal usage.

## Use Cases

### Regional pricing display

```javascript
const storefront = store.getStorefront();
if (storefront?.countryCode === 'JP') {
    // Show prices in JPY formatting
}
```

### Geo-compliance

```javascript
store.when().storefrontUpdated(s => {
    if (s.countryCode && ['DE', 'FR', 'IT', 'ES'].includes(s.countryCode)) {
        showEUComplianceNotice();
    }
});
```

### Product filtering

```javascript
const storefront = store.getStorefront();
if (storefront?.countryCode) {
    const availableProducts = allProducts.filter(
        p => p.availableRegions.includes(storefront.countryCode)
    );
    displayProducts(availableProducts);
}
```
