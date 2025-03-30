# Cordova Purchase Plugin

![](.gitbook/assets/banner.jpg)

> **In-App Purchases for Cordova, Capacitor, and Ionic**

---

Need professional help and support? [Contact Me](mailto:hoelt@fovea.cc).

## Summary

This plugin allows **In-App Purchases** (IAP) to be made from **Cordova, Capacitor, and Ionic** applications.

It provides a unified JavaScript API to handle in-app purchases across multiple platforms, simplifying development and maintenance.

**Supported Platforms & Features:**

| Feature                      | App Store (iOS/macOS) | Google Play (Android) | Braintree (iOS/Android)¹ | Test Platform |
| :--------------------------- | :-------------------: | :-------------------: | :----------------------: | :-----------: |
| Consumables                  |           ✅          |           ✅          |            ✅            |       ✅      |
| Multi-Quantity Consumables   |                       |           ✅          |                          |               |
| Non-Consumables              |           ✅          |           ✅          |                          |       ✅      |
| Auto-Renewing Subscriptions  |           ✅          |           ✅          |                          |       ✅      |
| Non-Renewing Subscriptions   |           ✅          |           ✅          |                          |               |
| Restore Purchases            |           ✅          |           ✅          |            ✅            |       ✅      |
| Payment Requests             |                       |                       |            ✅            |       ✅      |
| [Receipt Validation][iaptic] |           ✅          |           ✅          |            ✅            |       ✅      |
| Introductory Offers          |           ✅          |           ✅          |                          |       ✅      |
| Promotional Offers (iOS)     |           ✅          |                       |                          |               |
| Subscription Offers (GP)     |                       |           ✅          |                          |       ✅      |
| Manage Subscriptions UI      |           ✅          |           ✅          |                          |       ✅      |
| Manage Billing UI            |           ✅          |           ✅          |                          |       ✅      |

¹ *Requires the [cordova-plugin-purchase-braintree](https://github.com/j3k0/cordova-plugin-purchase-braintree) extension.*

## Documentation

This documentation provides guides and use cases for implementing In-App Purchases (IAP) using the `cordova-plugin-purchase` plugin.

**Key Sections:**

*   [**Introduction**](introduction.md): Overview and core concepts.
*   [**Discover**](discover/): Learn about IAP technology, the plugin's approach, and the critical importance of receipt validation.
*   [**Use Cases**](use-cases/): Step-by-step guides for implementing specific product types (Consumables, Subscriptions, etc.) on different platforms (App Store, Google Play, Braintree, Test). Includes setup instructions.
*   [**API Reference**](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api): Detailed documentation for all classes, methods, and properties.
*   [**Troubleshooting**](doc/troubleshooting.md): Solutions for common problems.
*   [**Migration Guide (v13)**](doc/migration-to-v13.md): Instructions for upgrading from older versions.

## Installation

### Cordova CLI

```bash
cordova plugin add cordova-plugin-purchase
```

### Capacitor

```bash
npm install cordova-plugin-purchase
npx cap sync
```
*(No specific Capacitor integration code is needed; use the Cordova plugin directly as shown in the examples).*

### Ionic

```bash
ionic cordova plugin add cordova-plugin-purchase
npm install cordova-plugin-purchase
```
*(Use without `@ionic-native/in-app-purchase-2` for plugin versions 13+).*

### Recommended Plugins

See the [Introduction](introduction.md#recommended-plugins) for optional plugins that enhance functionality (Network Information, Advanced HTTP).

## Quick Start Example (Test Platform)

```typescript
import 'cordova-plugin-purchase'; // Import for typings (optional but recommended)

document.addEventListener('deviceready', async () => {

  const { store, ProductType, Platform, LogLevel, ErrorCode } = CdvPurchase;

  // Set verbosity level
  store.verbosity = LogLevel.DEBUG;

  // Log errors
  store.error(err => {
    console.error("STORE ERROR: " + err.code + " " + err.message);
  });

  // Register a test product
  store.register({
    id: 'test_consumable',
    type: ProductType.CONSUMABLE,
    platform: Platform.TEST,
  });

  // Handle purchase approval
  store.when()
    .approved(transaction => {
      console.log('Purchase Approved:', transaction.transactionId);
      // Verify purchase (Test platform provides mock verification)
      transaction.verify();
    })
    .verified(receipt => {
      console.log('Purchase Verified:', receipt.id);
      // Finish the transaction to consume/acknowledge
      receipt.finish();
    })
    .finished(transaction => {
      console.log('Purchase Finished:', transaction.transactionId);
      alert('Test purchase complete!');
    });

  // Initialize the store with the Test platform
  try {
    await store.initialize([Platform.TEST]);
    console.log('Store initialized!');

    // Get product details
    const product = store.get('test_consumable', Platform.TEST);
    console.log('Test Product:', JSON.stringify(product));

    // Example: Initiate a purchase (will show a prompt)
    // product?.getOffer()?.order();

  } catch (err) {
    console.error('Store initialization failed:', err);
  }

}, false);
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to edit the documentation and submit changes.

## Sponsors & License

This plugin is maintained thanks to its sponsors. See the full [README on GitHub](https://github.com/j3k0/cordova-plugin-purchase#sponsors) for details.

Licensed under the MIT License.

---
[Documentation](introduction.md) | [GitHub](https://github.com/j3k0/cordova-plugin-purchase) | [Iaptic Validation](https://www.iaptic.com/)