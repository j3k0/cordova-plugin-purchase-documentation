# About the Plugin

The Cordova Purchase plugin (`cordova-plugin-purchase`) provides a unified JavaScript API (`CdvPurchase.store`) for interacting with various In-App Purchase platforms and payment providers from within Cordova, Capacitor, and Ionic applications.

## Core Goal: Abstraction

The primary goal is to abstract the complexities and differences between platform-specific SDKs (like Apple's StoreKit and Google Play Billing Library) and payment gateways (like Braintree). This allows developers to write purchase-related code once and have it work across multiple platforms with minimal platform-specific adjustments.

## Key Components & Flow

1.  **Initialization (`store.initialize()`):**
    *   You specify which platforms (App Store, Google Play, Braintree, Test) you want to activate.
    *   The plugin initializes the corresponding native SDKs or bridges.
    *   It attempts to load existing purchase receipts from the device.
    *   It fetches product details (title, price, description, offers) for registered products from the respective stores.

2.  **Product Registration (`store.register()`):**
    *   You tell the plugin about the products you've configured in the platform consoles (App Store Connect, Google Play Console).
    *   You provide the `id`, `type` (`ProductType`), and `platform` (`Platform`) for each product.

3.  **Event Handling (`store.when()`):**
    *   The plugin operates asynchronously. You register listeners for events to react to changes.
    *   **`productUpdated`:** Fires when product details (like price) are loaded or updated. Use this to update your UI.
    *   **`receiptUpdated`:** Fires when the local device receipt information changes (e.g., a new purchase is detected, a transaction finishes).
    *   **`approved`:** Fires when a payment is authorized by the platform but *before* it's finalized. **Crucially, verify this transaction before granting entitlement.**
    *   **`verified`:** Fires *after* a receipt/transaction has been successfully validated by your configured `store.validator`. This is the secure point to grant entitlement.
    *   **`finished`:** Fires after `transaction.finish()` or `receipt.finish()` successfully completes, acknowledging the transaction with the platform.
    *   **`pending`:** Fires if a transaction requires external action (e.g., Ask to Buy, delayed payment methods).
    *   **`error`:** Catches general plugin errors.

4.  **Initiating Purchases/Payments:**
    *   **`offer.order()`:** Initiates the purchase flow for a specific product offer loaded from a store (App Store, Google Play).
    *   **`store.requestPayment()`:** Initiates a payment request for a custom amount, typically used with payment gateways like Braintree.

5.  **Managing Purchases:**
    *   **`transaction.verify()`:** Sends the transaction's receipt data to your configured `store.validator`.
    *   **`transaction.finish()` / `receipt.finish()`:** Acknowledges the transaction(s) with the platform, marking them as processed. For consumables, this also consumes the item. **This is mandatory.**
    *   **`store.owned()`:** Checks if a product is currently considered owned based on available (preferably verified) receipt data.
    *   **`store.restorePurchases()`:** Asks the platform to restore previously purchased non-consumables and non-expired subscriptions.

6.  **Receipt Validation (`store.validator`):**
    *   You provide a URL to your backend server (or use a service like [Iaptic](https://www.iaptic.com/)) that can validate receipts with Apple/Google servers.
    *   The plugin sends receipt data to this endpoint during the `verify()` step.
    *   The validator returns the verified status and authoritative purchase details (like subscription expiry).
    *   **This is essential for security and reliable entitlement management.**

## Architecture

*   **JavaScript Core:** Provides the unified API (`CdvPurchase.store`) and manages adapters.
*   **Platform Adapters:** Internal components responsible for interacting with each specific platform (App Store, Google Play, Braintree, Test).
*   **Native Bridges:** Cordova plugins (Objective-C/Swift for iOS/macOS, Java/Kotlin for Android) that communicate with the native platform SDKs (StoreKit, Google Play Billing Library, Braintree SDK).

This layered approach allows the JavaScript API to remain consistent while the adapters and bridges handle the platform-specific implementations.