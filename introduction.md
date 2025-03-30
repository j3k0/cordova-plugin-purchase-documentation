# Introduction

Welcome to the documentation for the `cordova-plugin-purchase` plugin (v13+). This plugin provides a unified JavaScript API for integrating In-App Purchases (IAP) across multiple platforms like Apple App Store, Google Play, and payment gateways like Braintree, directly from your Cordova, Capacitor, or Ionic application.

## What This Plugin Does

*   **Abstracts Platform Differences:** Provides a single API (`CdvPurchase.store`) to manage products, purchases, and subscriptions, reducing the need for platform-specific code in your application logic.
*   **Handles Purchase Flows:** Initiates purchase requests (`store.order()`, `store.requestPayment()`), processes platform responses, and delivers transaction information to your app via event listeners (`store.when()`).
*   **Supports Various Product Types:** Consumables, Non-Consumables, Auto-Renewing Subscriptions (`PAID_SUBSCRIPTION`), Non-Renewing Subscriptions.
*   **Integrates with Payment Gateways:** Supports custom payment amounts via Braintree (requires the [cordova-plugin-purchase-braintree](https://github.com/j3k0/cordova-plugin-purchase-braintree) extension).
*   **Facilitates Receipt Validation:** Provides receipt data necessary for server-side validation, which is **crucial** for security and managing entitlements, especially subscriptions. Integrates easily with services like [Iaptic](https://www.iaptic.com/).
*   **Test Platform:** Includes a built-in `Platform.TEST` adapter for local development and testing without real store interaction.

## Who Is This For?

This documentation is for developers building hybrid mobile applications using frameworks like Cordova, Capacitor, or Ionic who need to implement In-App Purchases for digital goods or services.

## Key Concepts

Before diving into specific use cases, it's helpful to understand a few core concepts:

*   **`CdvPurchase.store`:** The main entry point for interacting with the plugin.
*   **`Platform`:** An enum representing the target store (`Platform.APPLE_APPSTORE`, `Platform.GOOGLE_PLAY`, `Platform.BRAINTREE`, `Platform.TEST`).
*   **`ProductType`:** An enum defining the type of item (`ProductType.CONSUMABLE`, `ProductType.NON_CONSUMABLE`, `ProductType.PAID_SUBSCRIPTION`, `ProductType.NON_RENEWING_SUBSCRIPTION`).
*   **`Product`:** An item available for purchase (e.g., "Unlock Premium Features", "100 Gold Coins", "Monthly Subscription"). Defined in the platform's developer console (App Store Connect, Google Play Console) and registered in the app using `store.register()`. Contains details like title, description, and offers.
*   **`Offer`:** A specific way to purchase a product, defining the price and duration (e.g., a monthly price, an annual price, an introductory offer for a subscription). Accessed via `product.getOffer()`.
*   **`Transaction`:** Represents an attempt to purchase or restore an item. Transactions go through various states (`TransactionState.INITIATED`, `TransactionState.APPROVED`, `TransactionState.FINISHED`, etc.). Found within `Receipt` objects.
*   **`Receipt`:** A record of purchases associated with a user's account on a specific platform, as reported by the device's SDK. Contains one or more transactions. Accessed via `store.localReceipts`.
*   **Receipt Validation:** The process of verifying the authenticity and details of a receipt with the platform's servers (Apple/Google). **This should always be done server-side.** [Read Why](discover/receipt-validation-importance.md).
*   **`VerifiedReceipt` / `VerifiedPurchase`:** The result of successful server-side receipt validation. Contains authoritative information (like subscription expiry dates). Accessed via `store.verifiedReceipts` and `store.verifiedPurchases`.
*   **Entitlement:** The user's right to access a feature or content based on a valid purchase. This should be managed based on *validated* receipts.
*   **`transaction.finish()` / `receipt.finish()`:** Acknowledging a purchase to the platform. This tells the store you have processed the transaction (and delivered the goods/service). It's mandatory to complete the transaction cycle, prevent repeated notifications, and (for consumables) allow repurchase.

## Recommended Plugins

While optional, these plugins enhance the purchase plugin's functionality:

*   **`cordova-plugin-network-information`**: Allows the purchase plugin to detect when the device comes back online after being offline, enabling quicker retries for failed network operations (like initialization or validation).
    ```bash
    cordova plugin add cordova-plugin-network-information
    npm install @capacitor/network # For Capacitor
    ```
*   **`cordova-plugin-advanced-http`**: Provides a more robust native HTTP client for receipt validation requests, bypassing potential browser limitations like CORS issues and offering advanced features like certificate pinning.
    ```bash
    cordova plugin add cordova-plugin-advanced-http
    npm install @awesome-cordova-plugins/http # Optional Ionic Native wrapper
    ```

## How to Use This Documentation

1.  **Discover:** Read the conceptual pages to understand IAP basics, the plugin's architecture, and the importance of receipt validation.
2.  **Use Cases:** Find the guide that matches your specific need (e.g., "Subscription on AppStore") and follow the setup and implementation steps. These provide practical, step-by-step examples.
3.  **API Reference:** Consult the detailed [API documentation](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api) for specific methods and properties of classes like `Store`, `Product`, `Offer`, `Transaction`, `Receipt`, etc.
4.  **Troubleshooting:** Check the [Troubleshooting Guide](doc/troubleshooting.md) for common problems and solutions.
5.  **Migration:** If upgrading from v11 or earlier, review the [Migration Guide](doc/migration-to-v13.md).

Ready? Let's get started with setting up your chosen platform or exploring a specific use case!
