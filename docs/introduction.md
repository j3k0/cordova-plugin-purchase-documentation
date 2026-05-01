---
title: "Introduction"
sidebar_position: 1
slug: /
---

# Introduction

Welcome to the documentation for the `cordova-plugin-purchase` plugin (version 13+). This plugin provides a unified JavaScript API for integrating In-App Purchases (IAP) across multiple platforms like Apple App Store, Google Play, and payment gateways like Braintree, directly from your Cordova, Capacitor, or Ionic application.

## What This Plugin Does

*   **Abstracts Platform Differences:** Provides a single API (`CdvPurchase.store`) to manage products, purchases, and subscriptions, reducing the need for platform-specific code in your application logic.
*   **Handles Purchase Flows:** Initiates purchase requests (`offer.order()`, `store.requestPayment()`), processes platform responses, and delivers transaction information to your app via event listeners (`store.when()`).
*   **Supports Various Product Types:** Consumables, Non-Consumables, Auto-Renewing Subscriptions (`PAID_SUBSCRIPTION`), Non-Renewing Subscriptions.
*   **Integrates with Payment Gateways:** Supports custom payment amounts via Braintree (requires the [cordova-plugin-purchase-braintree](https://github.com/j3k0/cordova-plugin-purchase-braintree) extension).
*   **Facilitates Receipt Validation:** Provides receipt data necessary for server-side validation, which is **crucial** for security and managing entitlements, especially subscriptions. Integrates easily with services like [Iaptic](https://www.iaptic.com/).
*   **Test Platform:** Includes a built-in `Platform.TEST` adapter for local development and testing without real store interaction.

## Supported Frameworks

The plugin supports the following frameworks:

*   **Cordova** — via `cordova-plugin-purchase` (the original integration).
*   **Capacitor** — via `capacitor-plugin-cdv-purchase`, a dedicated native package with its own StoreKit 2 and Google Play Billing bridges (no Cordova dependency). See [Capacitor Setup](setup/setup-capacitor.md).
*   **Ionic** — works with either of the above depending on your underlying runtime (Cordova or Capacitor).

The JavaScript API (`CdvPurchase.store`) is identical across all three — only installation and initialization differ.

## Who Is This For?

This documentation is for developers building hybrid mobile applications using frameworks like Cordova, Capacitor, or Ionic who need to implement In-App Purchases for digital goods or services.

## Key Concepts (v13+)

Understanding these core concepts is essential for using the plugin effectively:

*   **`CdvPurchase` Namespace:** The global namespace containing all plugin classes, enums, and the main `store` object. Access members like `CdvPurchase.store`, `CdvPurchase.ProductType`, `CdvPurchase.Platform`.
*   **`CdvPurchase.store`:** The main object for interacting with the plugin. Used for initialization, registration, event handling, and accessing products/receipts.
*   **`Platform`:** An enum representing the target store or payment provider (`Platform.APPLE_APPSTORE`, `Platform.GOOGLE_PLAY`, `Platform.BRAINTREE`, `Platform.TEST`).
*   **`ProductType`:** An enum defining the type of item (`ProductType.CONSUMABLE`, `ProductType.NON_CONSUMABLE`, `ProductType.PAID_SUBSCRIPTION`, `ProductType.NON_RENEWING_SUBSCRIPTION`).
*   **`Product`:** Represents an item available for purchase (e.g., "Unlock Premium Features", "100 Gold Coins", "Monthly Subscription"). You define these in the platform's developer console (App Store Connect, Google Play Console) and register them in the app using `store.register()`. A `Product` contains metadata like title, description, and one or more `Offer`s.
*   **`Offer`:** Represents a specific way to purchase a `Product`. It defines the price and terms. Subscriptions often have multiple offers (e.g., monthly vs. annual). An `Offer` contains one or more `PricingPhase`s. Accessed via `product.getOffer()`.
*   **`PricingPhase`:** Details a specific period within an `Offer`'s price, like a free trial, an introductory price period, or the regular recurring price. Contains `price`, `priceMicros`, `currency`, `billingPeriod`, `paymentMode`, etc. Accessed via `offer.pricingPhases`.
*   **`Receipt`:** A record of purchases associated with the user's platform account (App Store, Google Play) as reported *locally* by the device's SDK. Contains one or more `Transaction` objects. Accessed via `store.localReceipts`. **Local receipts should not be solely trusted for granting entitlements.**
*   **`Transaction`:** Represents a single purchase attempt within a `Receipt`. Transactions progress through states (`TransactionState.INITIATED`, `TransactionState.APPROVED`, `TransactionState.FINISHED`, etc.). Contains `transactionId`, `purchaseDate`, etc.
*   **Receipt Validation:** The **critical** process of verifying the authenticity and details of a purchase with the platform's servers (Apple/Google) via a secure backend. **This must always be done server-side.** [Read Why](discover/receipt-validation-importance.md).
*   **`store.validator`:** The configuration property where you provide the URL or function for your receipt validation service.
*   **`VerifiedReceipt` / `VerifiedPurchase`:** The result returned by your `store.validator` after successful validation. Contains authoritative purchase information (like subscription expiry dates, renewal status). Accessed via the `.verified()` event handler or `store.verifiedReceipts` / `store.verifiedPurchases`. **This is the trusted source for managing entitlements.**
*   **Entitlement:** The user's right to access a feature or content based on a *valid, verified* purchase.
*   **`transaction.finish()` / `receipt.finish()`:** Acknowledging a purchase to the platform. This signals that you have processed the transaction (and delivered the goods/service). It's **mandatory** to complete the transaction cycle, prevent repeated notifications, and (for consumables) allow repurchase.

## Basic Workflow (v13+)

1.  **Wait for `deviceready`**.
2.  **Register Products:** Tell the plugin about your products using `store.register([...])`.
3.  **Configure Validator:** Set `store.validator` to your validation service endpoint (highly recommended).
4.  **Setup Listeners:** Use `store.when()` to listen for events like `productUpdated`, `approved`, `verified`, `finished`.
5.  **Initialize:** Call `store.initialize([...platforms])` to activate the necessary platforms and load initial data.
6.  **Display Products:** Use data from `store.products` (updated via `productUpdated`) to show available items and prices in your UI.
7.  **Handle Purchase Request:** When a user wants to buy, call `offer.order()` or `store.requestPayment()`.
8.  **Process Approval:** In the `.approved()` listener, call `transaction.verify()`.
9.  **Process Verification:** In the `.verified()` listener, check the `VerifiedReceipt`, grant entitlement to the user, and call `receipt.finish()`.
10. **Handle Finished:** The `.finished()` listener confirms the transaction is complete. Update UI if necessary.

## Recommended Plugins

While optional, these Cordova plugins can enhance the purchase plugin's reliability and functionality:

*   **`cordova-plugin-network-information`**:
    *   **Why?** Allows the purchase plugin to detect when the device comes back online after being offline. This enables quicker retries for failed network operations, such as initialization attempts or receipt validation requests that failed due to network issues. Without it, the plugin relies on less frequent periodic retries.
    *   **Installation:**
        ```bash
        cordova plugin add cordova-plugin-network-information
        # For Capacitor: npm install @capacitor/network && npx cap sync
        ```

*   **`cordova-plugin-advanced-http`**:
    *   **Why?** Provides a native HTTP client for making network requests (like receipt validation). This bypasses potential browser limitations like CORS (Cross-Origin Resource Sharing) errors that can occur with standard web `fetch` or `XMLHttpRequest` when calling your validator. It can also offer more control over headers and potentially support features like certificate pinning for enhanced security.
    *   **Installation:**
        ```bash
        cordova plugin add cordova-plugin-advanced-http
        # Optional Ionic Native wrapper: npm install @awesome-cordova-plugins/http
        ```

## How to Use This Documentation

1.  **Discover:** Read the conceptual pages to understand IAP basics, the plugin's architecture, and the importance of receipt validation.
2.  **Use Cases:** Find the guide that matches your specific need (e.g., "Subscription on AppStore") and follow the setup and implementation steps. These provide practical, step-by-step examples.
3.  **API Reference:** Consult the detailed [API documentation](https://github.com/j3k0/cordova-plugin-purchase/tree/v13/api) for specific methods and properties of classes like `Store`, `Product`, `Offer`, `Transaction`, `Receipt`, etc.
4.  **Troubleshooting:** Check the [Troubleshooting Guide](doc/troubleshooting.md) for common problems and solutions.
5.  **Migration:** If upgrading from v11 or earlier, review the [Migration Guide](doc/migration-to-v13.md).

Ready? Let's get started with setting up your chosen platform or exploring a specific use case!
