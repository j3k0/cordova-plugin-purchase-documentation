# Cordova Purchase Plugin

![](.gitbook/assets/banner.jpg)

> **In-App Purchases for Cordova, Capacitor, and Ionic**

---

Need professional help and support? [Contact Me](mailto:hoelt@fovea.cc).

## Summary

This plugin allows **In-App Purchases** (IAP) to be made from **Cordova, Capacitor, and Ionic** applications using a single, unified JavaScript API.

It simplifies handling in-app purchases across multiple platforms by abstracting platform-specific complexities.

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

This documentation provides guides and use cases for implementing In-App Purchases (IAP) using the `cordova-plugin-purchase` plugin (version 13+).

**Key Sections:**

*   [**Introduction**](introduction.md): Overview and core concepts.
*   **Discover**: Learn about IAP technology, the plugin's approach, and the critical importance of receipt validation.
*   **Use Cases**: Step-by-step guides for implementing specific product types (Consumables, Subscriptions, etc.) on different platforms (App Store, Google Play, Braintree, Test). Includes setup instructions.
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
*(No specific Capacitor integration code is needed; use the Cordova plugin directly via the `CdvPurchase` global namespace as shown in the examples).*

### Ionic

```bash
ionic cordova plugin add cordova-plugin-purchase
npm install cordova-plugin-purchase
```
*(Use without `@ionic-native/in-app-purchase-2` for plugin versions 13+).*

### Recommended Plugins

See the [Introduction](introduction.md#recommended-plugins) for optional plugins that enhance functionality (Network Information, Advanced HTTP).

## Quick Start Example (Test Platform)

This example demonstrates the basic flow using the built-in **Test Platform**, which requires no App Store or Google Play setup.

**1. Wait for Device Ready:**
Ensure all plugin interactions happen after the `deviceready` event.

```typescript
document.addEventListener('deviceready', initializeStore, false);
```

**2. Initialize Store & Register Product:**
Inside your `initializeStore` function:

```typescript
async function initializeStore() {
  // Import necessary members from the CdvPurchase namespace
  const { store, ProductType, Platform, LogLevel, ErrorCode } = CdvPurchase;

  // Optional: Set log level for detailed debugging
  store.verbosity = LogLevel.DEBUG;

  // Optional: Basic error logging
  store.error(err => {
    console.error("STORE ERROR: " + err.code + " " + err.message);
  });

  // Register the test product
  store.register({
    id: 'test_consumable', // A built-in test product ID
    type: ProductType.CONSUMABLE,
    platform: Platform.TEST,
  });

  // Setup event listeners (see next step)
  setupListeners();

  // Initialize the Test platform
  try {
    await store.initialize([Platform.TEST]);
    console.log('Store initialized!');
    displayTestProduct(); // Function to show product info and buy button
  } catch (err) {
    console.error('Store initialization failed:', err);
  }
}
```

**3. Setup Event Listeners:**
Handle the purchase lifecycle events.

```typescript
function setupListeners() {
  const { store } = CdvPurchase;
  store.when()
    .productUpdated(product => {
      // Called when product details are loaded or updated
      console.log('Product updated: ' + product.id);
      displayTestProduct(); // Update UI
    })
    .approved(transaction => {
      console.log('Purchase Approved:', transaction.transactionId);
      // Purchase successful on the platform, now verify it.
      // For the Test platform, verify() simulates success immediately.
      transaction.verify();
    })
    .verified(receipt => {
      console.log('Purchase Verified.');
      // Purchase is valid. Unlock content / grant item.
      // Finish the transaction to acknowledge/consume it.
      receipt.finish();
    })
    .finished(transaction => {
      console.log('Purchase Finished:', transaction.transactionId);
      alert('Test purchase complete!');
      // Update UI, e.g., grant coins, unlock feature
    })
    .cancelled(transaction => {
      console.log('Purchase Cancelled:', transaction.transactionId);
      alert('Purchase cancelled.');
    })
    .error(err => {
      console.error('Store Error Handled:', err);
      alert('An error occurred: ' + err.message);
    });
}
```

**4. Display Product and Purchase Button:**
Create functions to show product info and trigger the purchase.

```typescript
function displayTestProduct() {
  const { store } = CdvPurchase;
  const product = store.get('test_consumable', Platform.TEST);
  const appEl = document.getElementById('app');
  if (!appEl) return;

  if (product) {
    appEl.innerHTML = `
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <p>Price: ${product.pricing?.price ?? 'N/A'}</p>
      <button id="buy-button">Buy</button>
    `;
    const buyButton = document.getElementById('buy-button');
    buyButton?.addEventListener('click', () => {
      const offer = product.getOffer();
      if (offer) {
        offer.order(); // Initiate the purchase
      } else {
        alert('Offer not available.');
      }
    });
  } else {
    appEl.innerHTML = '<p>Loading test product...</p>';
  }
}
```
*   **Note:** This example uses the `CdvPurchase` global namespace.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to edit the documentation and submit changes.

## Sponsors & License

This plugin is maintained thanks to its sponsors. See the full [README on GitHub](https://github.com/j3k0/cordova-plugin-purchase#sponsors) for details.

Licensed under the MIT License.

---
[Documentation](introduction.md) | [GitHub](https://github.com/j3k0/cordova-plugin-purchase) | [Iaptic Validation](https://www.iaptic.com/)
